import logging
from datetime import datetime, timezone

import discord
from discord import app_commands
from discord.ext import commands


logger = logging.getLogger(__name__)

EMBED_FIELD_LIMIT = 1024


def _single_line(value: str) -> str:
    """Keep Discord-provided names on a single output line."""
    return " ".join(value.splitlines()).strip()


def _safe_discord_text(value: str) -> str:
    """Escape user-controlled text before rendering it as Discord Markdown."""
    return discord.utils.escape_mentions(
        discord.utils.escape_markdown(_single_line(value))
    )


def _split_member_lines(
    members: list[discord.Member],
    emoji: str,
    max_members: int,
) -> tuple[list[str], int]:
    """Build complete-line member chunks that fit Discord embed fields."""
    chunks = []
    current_lines = []
    current_length = 0
    shown_members = members[:max_members]

    for member in shown_members:
        line = f"{emoji} {member.mention}"
        added_length = len(line) + (1 if current_lines else 0)

        if current_lines and current_length + added_length > EMBED_FIELD_LIMIT:
            chunks.append("\n".join(current_lines))
            current_lines = [line]
            current_length = len(line)
        else:
            current_lines.append(line)
            current_length += added_length

    if current_lines:
        chunks.append("\n".join(current_lines))

    return chunks, len(shown_members)


class RoleComparisonCog(commands.Cog):
    """Commands for comparing Discord role membership."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(
        name="compare_roles",
        description="Find members who have one role but are missing another role",
    )
    @app_commands.describe(
        base_role="Role whose members should be checked",
        required_role="Role that the checked members are expected to have",
        filter="Choose which comparison results to show",
        include_bots="Include bot accounts in the comparison",
        private="Show the result only to you",
    )
    @app_commands.choices(
        filter=[
            app_commands.Choice(name="All members", value="all"),
            app_commands.Choice(
                name="Only members with both roles",
                value="matching",
            ),
            app_commands.Choice(
                name="Only members missing the required role",
                value="missing",
            ),
        ]
    )
    @app_commands.guild_only()
    async def compare_roles(
        self,
        interaction: discord.Interaction,
        base_role: discord.Role,
        required_role: discord.Role,
        filter: str = "all",
        include_bots: bool = False,
        private: bool = False,
    ) -> None:
        """Compare two roles and report members missing the required role."""
        if base_role.id == required_role.id:
            await interaction.response.send_message(
                "Please select two different roles.",
                ephemeral=True,
            )
            return

        await interaction.response.defer(ephemeral=private)

        try:
            base_members = [
                member
                for member in base_role.members
                if include_bots or not member.bot
            ]
            required_member_ids = {
                member.id for member in required_role.members
            }
            matching_members = sorted(
                (
                    member
                    for member in base_members
                    if member.id in required_member_ids
                ),
                key=lambda member: (
                    member.display_name.casefold(),
                    member.name.casefold(),
                    member.id,
                ),
            )
            missing_members = sorted(
                (
                    member
                    for member in base_members
                    if member.id not in required_member_ids
                ),
                key=lambda member: (
                    member.display_name.casefold(),
                    member.name.casefold(),
                    member.id,
                ),
            )

            excluded_bots = (
                sum(1 for member in base_role.members if member.bot)
                if not include_bots
                else 0
            )
            base_role_name = _safe_discord_text(base_role.name)
            required_role_name = _safe_discord_text(required_role.name)
            filter_text = {
                "all": "All members",
                "matching": "Only members with both roles",
                "missing": "Only members missing the required role",
            }.get(filter, "All members")

            embed = discord.Embed(
                title="📊 Role Comparison",
                description=(
                    f"**Base Role:** {base_role.mention}\n"
                    f"**Required Role:** {required_role.mention}\n"
                    f"**Filter:** {filter_text}"
                ),
                color=(
                    discord.Color.green()
                    if not missing_members
                    else discord.Color.orange()
                ),
                timestamp=datetime.now(timezone.utc),
            )
            embed.add_field(
                name="Summary",
                value=(
                    f"**Total Members:** {len(base_members)}\n"
                    f"**Have Both Roles:** {len(matching_members)}\n"
                    f"**Missing {required_role_name}:** {len(missing_members)}"
                    + (
                        f"\n**Bots excluded:** {excluded_bots}"
                        if excluded_bots
                        else ""
                    )
                ),
                inline=False,
            )

            max_members_per_list = 50 if filter != "all" else 20
            shown_matching = 0
            shown_missing = 0

            if filter in {"all", "matching"}:
                if matching_members:
                    matching_chunks, shown_matching = _split_member_lines(
                        matching_members,
                        "✅",
                        max_members_per_list,
                    )
                    for index, chunk in enumerate(matching_chunks):
                        embed.add_field(
                            name=(
                                f"✅ Have Both Roles ({len(matching_members)})"
                                if index == 0
                                else "✅ Have Both Roles (continued)"
                            ),
                            value=chunk,
                            inline=False,
                        )
                elif filter == "matching" and base_members:
                    embed.add_field(
                        name="✅ Have Both Roles",
                        value="No members have both roles.",
                        inline=False,
                    )

            if filter in {"all", "missing"}:
                if missing_members:
                    missing_chunks, shown_missing = _split_member_lines(
                        missing_members,
                        "❌",
                        max_members_per_list,
                    )
                    for index, chunk in enumerate(missing_chunks):
                        embed.add_field(
                            name=(
                                f"❌ Missing {required_role_name} "
                                f"({len(missing_members)})"
                                if index == 0
                                else f"❌ Missing {required_role_name} "
                                "(continued)"
                            ),
                            value=chunk,
                            inline=False,
                        )
                elif filter == "missing" and base_members:
                    embed.add_field(
                        name=f"❌ Missing {required_role_name}",
                        value=(
                            f"Everyone with **{base_role_name}** also has "
                            f"**{required_role_name}**."
                        ),
                        inline=False,
                    )

            if not matching_members and not missing_members:
                embed.add_field(
                    name="Members",
                    value=f"**{base_role_name}** has no members to compare.",
                    inline=False,
                )

            if not base_members:
                embed.set_footer(text="No members to compare")
            elif filter == "matching":
                embed.set_footer(
                    text=(
                        f"Showing {shown_matching} of "
                        f"{len(matching_members)} matching member(s)"
                    )
                )
            elif filter == "missing":
                if missing_members:
                    embed.set_footer(
                        text=(
                            f"⚠️ Showing {shown_missing} of "
                            f"{len(missing_members)} member(s) missing "
                            f"{required_role.name}"
                        )
                    )
                else:
                    embed.set_footer(text="🎉 Everyone has both roles!")
            elif missing_members:
                embed.set_footer(
                    text=(
                        f"⚠️ {len(missing_members)} member(s) are missing "
                        f"{required_role.name}"
                    )
                )
            else:
                embed.set_footer(text="🎉 Everyone has both roles!")

            await interaction.followup.send(
                embed=embed,
                ephemeral=private,
            )
            logger.info(
                "Role comparison completed in guild %s by user %s: "
                "base_role=%s required_role=%s checked=%s missing=%s",
                interaction.guild_id,
                interaction.user.id,
                base_role.id,
                required_role.id,
                len(base_members),
                len(missing_members),
            )
        except Exception:
            logger.exception(
                "Role comparison failed in guild %s for user %s",
                interaction.guild_id,
                interaction.user.id,
            )
            await interaction.followup.send(
                "An error occurred while comparing the roles. "
                "Please try again later.",
                ephemeral=True,
            )


async def setup(bot: commands.Bot) -> None:
    """Load the role comparison cog."""
    await bot.add_cog(RoleComparisonCog(bot))
