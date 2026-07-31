import io
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


def _member_label(member: discord.Member) -> str:
    """Return a readable member label without creating a Discord mention."""
    display_name = _safe_discord_text(member.display_name)
    username = _safe_discord_text(member.name)
    return f"{display_name} (@{username})"


def _build_preview(lines: list[str]) -> tuple[str, int]:
    """Build a complete-line preview that fits in one Discord embed field."""
    preview = []
    current_length = 0

    for line in lines:
        added_length = len(line) + (1 if preview else 0)
        if current_length + added_length > EMBED_FIELD_LIMIT:
            break
        preview.append(line)
        current_length += added_length

    return "\n".join(preview), len(preview)


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
        include_bots="Include bot accounts in the comparison",
        private="Show the result only to you",
    )
    @app_commands.guild_only()
    async def compare_roles(
        self,
        interaction: discord.Interaction,
        base_role: discord.Role,
        required_role: discord.Role,
        include_bots: bool = False,
        private: bool = True,
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
            matching_count = len(base_members) - len(missing_members)
            base_role_name = _safe_discord_text(base_role.name)
            required_role_name = _safe_discord_text(required_role.name)

            embed = discord.Embed(
                title="Role Comparison",
                description=(
                    f"Members with **{base_role_name}** who are missing "
                    f"**{required_role_name}**."
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
                    f"**Checked:** {len(base_members)}\n"
                    f"**Have both roles:** {matching_count}\n"
                    f"**Missing {required_role_name}:** {len(missing_members)}"
                    + (
                        f"\n**Bots excluded:** {excluded_bots}"
                        if excluded_bots
                        else ""
                    )
                ),
                inline=False,
            )

            report_file = None
            if missing_members:
                member_lines = [
                    f"• {_member_label(member)}" for member in missing_members
                ]
                preview, shown_count = _build_preview(member_lines)
                embed.add_field(
                    name=f"Missing Members ({len(missing_members)})",
                    value=preview,
                    inline=False,
                )

                if shown_count < len(missing_members):
                    embed.set_footer(
                        text=(
                            f"Showing {shown_count} of {len(missing_members)} "
                            "members. See the attached file for the complete list."
                        )
                    )
                    report_lines = [
                        (
                            f"{index}. {_single_line(member.display_name)} "
                            f"(@{_single_line(member.name)}) [{member.id}]"
                        )
                        for index, member in enumerate(missing_members, start=1)
                    ]
                    report = (
                        "Role comparison\n"
                        f"Base role: {_single_line(base_role.name)} "
                        f"[{base_role.id}]\n"
                        f"Required role: {_single_line(required_role.name)} "
                        f"[{required_role.id}]\n"
                        f"Missing members: {len(missing_members)}\n\n"
                        + "\n".join(report_lines)
                    )
                    report_file = discord.File(
                        io.BytesIO(report.encode("utf-8")),
                        filename=(
                            f"role-comparison-{base_role.id}-"
                            f"{required_role.id}.txt"
                        ),
                    )
            else:
                embed.add_field(
                    name="Missing Members",
                    value=(
                        f"Everyone with **{base_role_name}** also has "
                        f"**{required_role_name}**."
                    ),
                    inline=False,
                )

            send_kwargs = {
                "embed": embed,
                "ephemeral": private,
                "allowed_mentions": discord.AllowedMentions.none(),
            }
            if report_file is not None:
                send_kwargs["file"] = report_file

            await interaction.followup.send(**send_kwargs)
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
