FROM pochi-browser-verification-base

ENV WASP_TELEMETRY_DISABLE=1

RUN npm i -g @wasp.sh/wasp-cli@latest

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN git config --global user.email "test@example.com" && \
    git config --global user.name "Test User" && \
    cd /home/user && \
    wasp new app -t minimal && \
    chmod -R 0755 /home/user/app

LABEL Author="any-task-builder"
LABEL Description="Wasp development environment with Node.js 24.x, Wasp CLI, and a seeded multi-tenant billing application skeleton."

CMD ["/bin/bash"]

COPY test_initial_state.py /bootstrap/test_initial_state.py

# Setup entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
