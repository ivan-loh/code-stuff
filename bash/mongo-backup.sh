#!/bin/bash

# Sets the current date and parameters
_now=$(date +"%m_%d_%Y")
_path="./adhoc_backup_$_now"
_file="./adhoc_backup_$_now.tgz"
_filefullpath="$PWD/adhoc_backup_$_now.tgz"

echo $_filefullpath

# Performs backup compression and cleanup
mongodump --db tide --out "$_path"
tar cvzf "$_file" "$_path"
rm -rf $_path
