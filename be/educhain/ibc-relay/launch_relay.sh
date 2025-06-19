#!/bin/bash

# Launch the IBC relay client

# Set the configuration file path
CONFIG_FILE="./config/config.toml"

# Check if the configuration file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Start the IBC relay client
echo "Starting IBC relay client with configuration: $CONFIG_FILE"
relayer start --config "$CONFIG_FILE"