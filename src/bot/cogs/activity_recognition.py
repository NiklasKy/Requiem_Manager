import discord
from discord.ext import commands
from discord import app_commands
import logging
from datetime import datetime
import os
import base64
import io
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class ActivityRecognitionCog(commands.Cog):
    """Cog for recognizing and extracting activity data from game screenshots"""
    
    def __init__(self, bot):
        self.bot = bot
        self.openai_client = None
        
        # Load authorized role IDs and user IDs from environment
        self.admin_role_ids = self._parse_ids(os.getenv('ADMIN_ROLE_IDS', ''))
        self.mod_role_ids = self._parse_ids(os.getenv('MOD_ROLE_IDS', ''))
        self.admin_user_ids = self._parse_ids(os.getenv('ADMIN_USER_IDS', ''))
        
        logger.info(f"Activity Recognition - Admin roles: {len(self.admin_role_ids)}, Mod roles: {len(self.mod_role_ids)}, Admin users: {len(self.admin_user_ids)}")
        
        # Initialize OpenAI client if API key is available
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key and api_key != 'your_openai_api_key_here':
            self.openai_client = AsyncOpenAI(api_key=api_key)
            logger.info("OpenAI client initialized for activity recognition")
        else:
            logger.warning("OpenAI API key not found or not configured. Activity recognition will not work.")
    
    def _parse_ids(self, ids_str: str) -> set:
        """Parse comma-separated IDs (role or user) from environment variable"""
        if not ids_str:
            return set()
        try:
            return {int(id_val.strip()) for id_val in ids_str.split(',') if id_val.strip()}
        except ValueError as e:
            logger.error(f"Error parsing IDs from '{ids_str}': {e}")
            return set()
    
    def _has_authorization(self, member: discord.Member) -> bool:
        """Check if member has admin/moderator role OR is an admin user"""
        # Check if user is in admin user list
        if member.id in self.admin_user_ids:
            return True
        
        # Check if user has admin or moderator role
        member_role_ids = {role.id for role in member.roles}
        return bool(member_role_ids & (self.admin_role_ids | self.mod_role_ids))
    
    async def analyze_activity_image(self, image_data: bytes) -> dict:
        """
        Analyze a game activity screenshot using OpenAI Vision API
        
        Args:
            image_data: Raw bytes of the image
            
        Returns:
            dict: Parsed data containing member names and activity points
        """
        if not self.openai_client:
            raise ValueError("OpenAI client is not initialized. Please configure OPENAI_API_KEY.")
        
        try:
            # Encode image to base64
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
            # Create the prompt for OpenAI
            prompt = """Analyze this image from a game interface. It shows a list of members with their activity statistics.

Please extract the following information for each member visible in the image:
- Member Name (the username/nickname shown)
- Week Activity Point (the numerical weekly activity points)

Return the data in a structured format as a JSON array like this:
[
  {
    "member_name": "Example Player",
    "week_activity_points": 1234
  }
]

Important:
- Only include members that are clearly visible and readable
- If you can't read a name or number clearly, skip that entry
- Week Activity Points should be numbers only (no text)
- Preserve the exact spelling of member names as shown in the image
- If the image shows different columns, focus on "Member Name" and "Week Activity Point" columns
- Return ONLY the JSON array, no additional text or explanation"""

            # Call OpenAI Vision API
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.2
            )
            
            # Extract the response
            content = response.choices[0].message.content
            
            # Parse the JSON response
            import json
            # Remove markdown code blocks if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            content = content.strip()
            
            data = json.loads(content)
            
            return {
                "success": True,
                "data": data,
                "count": len(data)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing activity image: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": []
            }
    
    @app_commands.command(
        name="analyze_activity",
        description="Analyze game activity screenshots to extract member names and weekly points"
    )
    @app_commands.describe(
        image1="First screenshot of activity data",
        image2="Second screenshot (optional)",
        image3="Third screenshot (optional)",
        image4="Fourth screenshot (optional)",
        image5="Fifth screenshot (optional)"
    )
    async def analyze_activity(
        self,
        interaction: discord.Interaction,
        image1: discord.Attachment,
        image2: discord.Attachment = None,
        image3: discord.Attachment = None,
        image4: discord.Attachment = None,
        image5: discord.Attachment = None
    ):
        """Analyze activity screenshots and extract member data"""
        
        # Check permissions - must be admin user, admin role, or moderator role
        if not self._has_authorization(interaction.user):
            await interaction.response.send_message(
                "❌ You don't have permission to use this command. This command is restricted to administrators and moderators.",
                ephemeral=True
            )
            logger.warning(f"Unauthorized access attempt to /analyze_activity by {interaction.user.name} (ID: {interaction.user.id})")
            return
        
        # Check if OpenAI is configured
        if not self.openai_client:
            await interaction.response.send_message(
                "❌ Activity recognition is not configured. Please set the OPENAI_API_KEY environment variable.",
                ephemeral=True
            )
            return
        
        # Defer the response as this might take a while
        await interaction.response.defer()
        
        try:
            # Collect all provided images
            images = [img for img in [image1, image2, image3, image4, image5] if img is not None]
            
            # Validate that all attachments are images
            valid_image_types = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
            for img in images:
                if img.content_type not in valid_image_types:
                    await interaction.followup.send(
                        f"❌ Invalid file type: {img.filename}. Please upload only image files (PNG, JPEG, WebP, GIF).",
                        ephemeral=True
                    )
                    return
            
            # Process each image
            all_members = []
            processing_embed = discord.Embed(
                title="🔄 Processing Activity Screenshots",
                description=f"Analyzing {len(images)} image(s)...",
                color=discord.Color.blue(),
                timestamp=datetime.utcnow()
            )
            
            for idx, img in enumerate(images, 1):
                processing_embed.add_field(
                    name=f"Image {idx}",
                    value=f"📊 {img.filename} - Processing...",
                    inline=False
                )
            
            await interaction.followup.send(embed=processing_embed)
            
            # Analyze each image
            for idx, img in enumerate(images, 1):
                try:
                    # Download image data
                    image_data = await img.read()
                    
                    # Analyze the image
                    result = await self.analyze_activity_image(image_data)
                    
                    if result["success"]:
                        all_members.extend(result["data"])
                        logger.info(f"Successfully analyzed image {idx}: {result['count']} members found")
                    else:
                        logger.error(f"Failed to analyze image {idx}: {result.get('error', 'Unknown error')}")
                        
                except Exception as e:
                    logger.error(f"Error processing image {idx}: {e}")
            
            # Remove duplicates (keep highest activity points if duplicate names)
            unique_members = {}
            for member in all_members:
                name = member.get("member_name", "Unknown")
                points = member.get("week_activity_points", 0)
                
                if name not in unique_members or unique_members[name] < points:
                    unique_members[name] = points
            
            # Sort by activity points (highest first)
            sorted_members = sorted(
                [{"member_name": name, "week_activity_points": points} 
                 for name, points in unique_members.items()],
                key=lambda x: x["week_activity_points"],
                reverse=True
            )
            
            # Create result embed with timestamp
            now = datetime.utcnow()
            timestamp_unix = int(now.timestamp())
            
            result_embed = discord.Embed(
                title="📊 Activity Analysis Results",
                description=f"<t:{timestamp_unix}:F>\n\nFound **{len(sorted_members)}** unique members from {len(images)} image(s)",
                color=discord.Color.green(),
                timestamp=now
            )
            
            # Add member data to embed (split into multiple fields if needed)
            if sorted_members:
                # Format the data
                member_list = []
                for member in sorted_members:
                    name = member["member_name"]
                    points = member["week_activity_points"]
                    member_list.append(f"**{name}**: {points:,} points")
                
                # Discord embed fields have a 1024 character limit
                # Split into multiple fields if needed
                current_field = []
                current_length = 0
                field_num = 1
                
                for member_line in member_list:
                    line_length = len(member_line) + 1  # +1 for newline
                    
                    if current_length + line_length > 1024:
                        # Add current field and start a new one
                        result_embed.add_field(
                            name=f"Members (Part {field_num})" if field_num > 1 else "Members",
                            value="\n".join(current_field),
                            inline=False
                        )
                        current_field = [member_line]
                        current_length = line_length
                        field_num += 1
                    else:
                        current_field.append(member_line)
                        current_length += line_length
                
                # Add the last field
                if current_field:
                    result_embed.add_field(
                        name=f"Members (Part {field_num})" if field_num > 1 else "Members",
                        value="\n".join(current_field),
                        inline=False
                    )
                
                # Add summary statistics (only highest and lowest)
                result_embed.add_field(
                    name="📈 Summary",
                    value=f"**Highest**: {sorted_members[0]['member_name']} ({sorted_members[0]['week_activity_points']:,} points)\n"
                          f"**Lowest**: {sorted_members[-1]['member_name']} ({sorted_members[-1]['week_activity_points']:,} points)",
                    inline=False
                )
            else:
                result_embed.description = "⚠️ No member data could be extracted from the provided images."
                result_embed.color = discord.Color.orange()
            
            # Send the final result
            await interaction.followup.send(embed=result_embed)
            
        except Exception as e:
            logger.error(f"Error in analyze_activity command: {e}")
            await interaction.followup.send(
                f"❌ An error occurred while analyzing the images: {str(e)}",
                ephemeral=True
            )

async def setup(bot):
    await bot.add_cog(ActivityRecognitionCog(bot))

