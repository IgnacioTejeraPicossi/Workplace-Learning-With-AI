FROM ubuntu

COPY ./LM-Studio* /data/lms/
COPY ./models/ /data/lms/models/
COPY ./http-server-config.json /http-server-config.json
RUN apt-get update
RUN apt-get install -y x11-utils x11-xserver-utils x11vnc dbus xvfb xdg-utils libglib2.0-0 libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libcairo2 libgtk-3-0 libgbm1 libasound2t64 libgomp1

RUN mkdir -p /root/.vnc && x11vnc --storepasswd x11pwd /root/.vnc/passwd
ENV DISPLAY=:99

RUN chmod ugo+x /data/lms/*.AppImage
RUN /data/lms/*.AppImage --appimage-extract
RUN cd /squashfs-root/
RUN chown root:root /squashfs-root/chrome-sandbox
RUN chmod 4755 /squashfs-root/chrome-sandbox
COPY start_services.sh /start_services.sh
RUN chmod +x /start_services.sh

CMD ["/start_services.sh"]
