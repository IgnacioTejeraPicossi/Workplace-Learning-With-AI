#!/bin/bash

service dbus start
Xvfb :99 -screen 0 1920x1080x16 & 
sleep 2
/squashfs-root/lm-studio --no-sandbox & 
sleep 60
cp -f /http-server-config.json /root/.lmstudio/.internal/http-server-config.json
cp -f -r /data/lms/models/* /root/.lmstudio/models
/root/.lmstudio/bin/lms server start --cors & 
sleep 10
/root/.lmstudio/bin/lms load lfm2-1.2b
sleep infinity