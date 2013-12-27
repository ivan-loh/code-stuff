#!/bin/bash

if [ $EUID != 0 ]; then
    sudo "$0" "$@"
    exit $?
fi

for user in $(cut -f1 -d: /etc/passwd); do echo $user; sudo crontab -u $user -l; done
