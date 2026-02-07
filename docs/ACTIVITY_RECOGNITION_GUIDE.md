# Activity Recognition Guide

## Overview

The Activity Recognition feature uses OpenAI's Vision API to automatically extract member names and weekly activity points from game screenshots. This eliminates the need for manual data entry and provides quick insights into player activity.

## Features

- 🤖 **AI-Powered Recognition**: Uses GPT-4 Vision to accurately read text from screenshots
- 📊 **Multi-Image Support**: Upload up to 5 images at once
- 🔄 **Automatic Deduplication**: Handles duplicate entries by keeping the highest score
- 📈 **Instant Statistics**: Provides total, average, highest, and lowest activity points
- 🎯 **Accurate Extraction**: High precision text recognition even with complex UI elements

## Setup

### 1. Get an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (you won't be able to see it again!)

### 2. Configure Environment Variables

Add your OpenAI API key and authorized role IDs to the `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Moderator Configuration (Role IDs that can use /analyze_activity)
MOD_ROLE_IDS=123456789012345678,987654321098765432
```

**Important**: 
- Never commit your `.env` file to version control!
- Only users with roles listed in `ADMIN_ROLE_IDS` or `MOD_ROLE_IDS` can use this command
- You can find role IDs by right-clicking a role in Discord (with Developer Mode enabled)

### 3. Restart the Bot

If running with Docker:
```bash
docker-compose down
docker-compose up -d
```

If running locally:
```bash
python -m src.bot.main
```

## Usage

### Permissions

This command is **restricted** to users with specific roles:
- Users with roles listed in `ADMIN_ROLE_IDS` environment variable
- Users with roles listed in `MOD_ROLE_IDS` environment variable

If a user without these roles tries to use the command, they will receive an error message.

### Discord Command

Use the `/analyze_activity` slash command in Discord:

```
/analyze_activity image1:<screenshot> [image2:<screenshot>] [image3:<screenshot>] [image4:<screenshot>] [image5:<screenshot>]
```

### Parameters

- **image1** (required): First screenshot to analyze
- **image2-5** (optional): Additional screenshots

### Supported Image Formats

- PNG (.png)
- JPEG (.jpg, .jpeg)
- WebP (.webp)
- GIF (.gif)

### Example Usage

1. Take a screenshot of your game's activity leaderboard
2. In Discord, type `/analyze_activity`
3. Upload your screenshot(s) using the file picker
4. Press Enter and wait for the results

The bot will:
1. Process each image with OpenAI Vision API
2. Extract all visible member names and activity points
3. Remove duplicates (keeping highest scores)
4. Sort results by activity points (highest first)
5. Display results in a formatted embed with statistics

## Expected Screenshot Format

The AI works best when screenshots include:

- **Clear, readable text** (not too small or blurry)
- **Table or list format** with columns
- **Member names** in one column
- **Activity points** (numbers) in another column
- **Good contrast** between text and background

### Example Table Structure

```
Member Name          | Level | Online Status | Week Activity Point
---------------------|-------|---------------|--------------------
PlayerOne            | 55    | Online        | 3527
PlayerTwo            | 55    | Online        | 2551
PlayerThree          | 55    | Online        | 2707
```

The AI will extract:
- Member Name: PlayerOne, PlayerTwo, PlayerThree
- Week Activity Points: 3527, 2551, 2707

## Output Format

The bot returns a Discord embed with:

### Header
- Total number of unique members found
- Number of images analyzed

### Member List
- Sorted by activity points (highest to lowest)
- Format: `**Member Name**: X,XXX points`
- Split into multiple fields if needed (Discord limit: 1024 chars/field)

### Statistics
- **Total Points**: Sum of all activity points
- **Average Points**: Mean activity per member
- **Highest**: Top performer with their score
- **Lowest**: Lowest activity with their score

### Example Output

```
📊 Activity Analysis Results
Found 6 unique members from 1 image(s)

Members
• **NiklasKy**: 3,527 points
• **BoRsH**: 2,863 points
• **itsyunnie**: 2,707 points
• **JLButterfly**: 2,435 points
• **Painhaze**: 2,551 points
• **愛Sunless**: 1,378 points

📈 Statistics
Total Points: 15,461
Average Points: 2,576.8
Highest: NiklasKy (3,527)
Lowest: 愛Sunless (1,378)
```

## Tips for Best Results

### 0. Get Role IDs (First Time Setup)

To configure `MOD_ROLE_IDS`:
1. Enable Developer Mode in Discord (Settings > Advanced > Developer Mode)
2. Right-click on a role in Server Settings > Roles
3. Click "Copy ID"
4. Add the ID to `MOD_ROLE_IDS` in `.env` (comma-separated for multiple roles)
5. Restart the bot

### 1. Screenshot Quality
- Use high resolution screenshots
- Ensure text is not pixelated
- Avoid compression artifacts

### 2. Lighting & Contrast
- Good contrast between text and background
- Avoid glare or reflection
- Clear, readable fonts

### 3. Cropping
- Include the entire table/list
- Keep column headers visible when possible
- Remove unnecessary UI elements

### 4. Multiple Images
- Use multiple screenshots if data spans multiple pages
- The bot automatically merges results
- Duplicates are handled intelligently

### 5. Text Clarity
- Zoom in if text is small
- Use in-game UI scaling if available
- Avoid motion blur

## Troubleshooting

### "You don't have permission to use this command"
**Problem**: User doesn't have required role

**Solution**:
1. Check that user has a role listed in `ADMIN_ROLE_IDS` or `MOD_ROLE_IDS`
2. Verify role IDs are correct in `.env` (use Developer Mode to copy role IDs)
3. Ensure `.env` has been updated and bot restarted
4. Check bot logs for loaded role IDs: `docker-compose logs bot | grep "Activity Recognition"`

### "OpenAI client is not initialized"
**Problem**: OpenAI API key is not configured or invalid

**Solution**:
1. Check that `OPENAI_API_KEY` is set in `.env`
2. Verify the key starts with `sk-`
3. Ensure it's not set to `your_openai_api_key_here`
4. Restart the bot after changing `.env`

### "No member data could be extracted"
**Problem**: AI couldn't recognize data in the image

**Possible causes**:
- Image quality is too low
- Text is too small or blurry
- Unusual table format
- Wrong image uploaded

**Solutions**:
1. Try a higher quality screenshot
2. Ensure the table is clearly visible
3. Check that member names and points are readable
4. Try cropping to focus on the data table

### "Invalid file type"
**Problem**: Uploaded file is not a supported image format

**Solution**: Convert to PNG, JPEG, WebP, or GIF

### Slow Response Time
**Problem**: Command takes a long time

**Explanation**: 
- OpenAI Vision API processing can take 5-30 seconds per image
- Multiple images increase processing time
- This is normal behavior

**Tips**:
- Be patient, the bot will respond when ready
- Avoid uploading too many images at once
- Consider splitting large batches into multiple commands

## API Costs

### OpenAI Pricing
- GPT-4 Vision API charges per image
- High detail images: ~$0.01-0.03 per image
- Check [OpenAI Pricing](https://openai.com/pricing) for current rates

### Cost Management
- Monitor usage on OpenAI dashboard
- Set monthly spending limits
- Consider image count when using command
- 5 images ≈ $0.05-0.15 per command

## Privacy & Security

### Data Handling
- Images are sent to OpenAI's API for processing
- OpenAI processes the image and returns text data
- Images are not stored by this bot
- Check [OpenAI Privacy Policy](https://openai.com/policies/privacy-policy) for details

### Best Practices
- Don't upload screenshots with sensitive personal information
- Be aware that images are processed by third-party AI
- Consider anonymizing data before uploading if needed
- Use only game-related screenshots

## Advanced Configuration

### Model Selection
The cog uses `gpt-4o` model by default. To change:

Edit `src/bot/cogs/activity_recognition.py`:
```python
model="gpt-4o"  # Change to "gpt-4-vision-preview" or other vision models
```

### Prompt Customization
To adapt for different game UIs, edit the prompt in `analyze_activity_image()`:

```python
prompt = """Your custom prompt here..."""
```

### Image Detail Level
Adjust the `detail` parameter for cost/accuracy tradeoff:

```python
"detail": "high"  # Options: "low", "high", "auto"
```

- **high**: Best accuracy, higher cost
- **low**: Faster, cheaper, lower accuracy  
- **auto**: OpenAI decides based on image

## Limitations

### Technical Limits
- **Max images per command**: 5
- **Max image size**: ~20MB per image (Discord limit)
- **Processing time**: 5-30 seconds per image
- **Discord embed**: 6000 total characters, 25 fields

### Recognition Limits
- Works best with clear, high-contrast text
- May struggle with:
  - Very small text (<12px)
  - Heavily stylized fonts
  - Complex overlays or effects
  - Occluded or partially visible text
  - Non-Latin characters (depending on game)

### API Limits
- OpenAI API rate limits apply
- Requires active internet connection
- Costs money per request
- May be slower during high API load

## Future Enhancements

Potential improvements:
- [ ] Export results to CSV
- [ ] Historical tracking of activity over time
- [ ] Comparison between time periods
- [ ] Integration with database for persistent storage
- [ ] Activity trend graphs
- [ ] Automatic scheduling for regular checks
- [ ] Support for more game types
- [ ] Custom parsing templates

## Support

### Issues with the Feature
1. Check bot logs: `docker-compose logs bot`
2. Verify OpenAI API key is valid
3. Test with a simple, clear screenshot
4. Check OpenAI API status

### Getting Help
- Report bugs via GitHub Issues
- Provide example screenshots (with sensitive data removed)
- Include error messages and logs
- Mention your OpenAI model version

## Examples

### Command Examples

**Single image:**
```
/analyze_activity image1:screenshot.png
```

**Multiple images:**
```
/analyze_activity image1:page1.png image2:page2.png image3:page3.png
```

### Use Cases

1. **Weekly Reports**: Generate activity reports for guild management
2. **Competition Tracking**: Monitor activity during guild events
3. **Member Activity**: Track individual member engagement
4. **Leaderboards**: Quick leaderboard snapshots
5. **Trend Analysis**: Compare activity across multiple weeks

---

**Made with ❤️ for the Requiem Community**

