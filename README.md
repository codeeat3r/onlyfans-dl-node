# OF-DL

# Prerequisite
- Install node [https://nodejs.org/en/download/] (required)
- Install git [https://git-scm.com/downloads]
- You must have an account
- You must be subscribed to the profile you want to download

# Instruction
- Sign in to your profile on a PC
- Copy your access token and User-Agent information. This can be found in the the network tab. 
- Open the developer console (`Crtl + Shift + i` on Windows or right click the page and select `inspect`)
- Switch to the `network` tab and filter down to `XHR`
- Highlight any request that has `https://onlyfans.com/api2/v2/` and check under `Request Headers`
- `Access token` and `User-Agent` should be there
- Download or clone repo
- Open a command line/terminal in the folder of the repo
- Run `npm install`
- Open `constants.js` file and update the "User-Agent" information (must be accurate at all times, else you'll be logged out)
- Type of media type and limit can be tweaked in the same file as needed
- Run the app with the command `npm start <profile-name*> <access-token>` [*account you want to download]

# Disclaimer
- This tool doesn't provide unauthorized access/download and is not encouraged. Download is at user's discretion and is solely responsible for adhering to privacy regulations.
- This tool doesn't store any personal information or file of the user or the profile the user downloads on any remote server. All files remain on the user's PC.
- Any abuse of this tool by the user is at the user's discretion and will solely bear the consequences that may arise from this.
