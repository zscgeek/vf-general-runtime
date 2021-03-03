#!/bin/bash

brew list mkcert

if [ $? -ne 0 ]; then
    echo "mkcert was not detected by Brew, installing now!"
    brew install mkcert
    mkcert -install
fi

rm -rf certs/
mkdir -p certs/ && cd certs/
LAN_IP=$(ifconfig en0 | grep "inet " | awk '{print $2}')
$(brew --prefix mkcert)/bin/mkcert localhost 127.0.0.1 ::1 $LAN_IP

# Rename certificate and key
mv *-key.pem localhost.key
mv *.pem localhost.crt
