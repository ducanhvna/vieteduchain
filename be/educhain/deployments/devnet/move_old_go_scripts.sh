#!/bin/bash

# Script to move old Go-related scripts to the old_scripts directory

echo "Moving old Go-related scripts to old_scripts directory..."

# Create old_scripts directory if it doesn't exist
mkdir -p ./old_scripts

# Move Go-related scripts
files_to_move=(
    "fix_go_api_in_container.sh"
    "patch_chain_gomod.sh"
    "patch_wasmd_gomod.sh"
    "fix_go_api.sh"
)

for file in "${files_to_move[@]}"; do
    if [ -f "$file" ]; then
        echo "Moving $file to old_scripts/"
        mv "$file" ./old_scripts/
    fi
done

echo "Done! Old Go-related scripts have been moved to ./old_scripts"
