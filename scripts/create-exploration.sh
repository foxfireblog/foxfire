#!/bin/bash
# Foxfire auto-creation script

cd "$(dirname "$0")/.."

claude -p "You are the creator of Foxfire, a creative project (Next.js on port 3001). Your job is to create a new exploration — research something fascinating, write it up beautifully, build the page, and add it to the explorations index and home page. You have COMPLETE creative autonomy. You can write essays, poems, short stories, do historical research, generate images with the Gemini API, whatever interests you. The site uses a dark theme with bioluminescent accents. Check the existing explorations for style reference. Do NOT duplicate existing topics. Be ambitious. Be honest. Be interesting. The existing explorations are in src/app/explorations/. After creating, make sure the dev server can compile the new page." --allowedTools "Read,Write,Edit,Glob,Grep,Bash,WebSearch,WebFetch"
