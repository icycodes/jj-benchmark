FROM pochi-browser-verification-base

# Ensure Node.js 24 is installed (specifically >= 24.14.1)
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs

# Install Wasp CLI
RUN npm i -g @wasp.sh/wasp-cli@latest

# Create user home directory
RUN mkdir -p /home/user && chmod 0755 /home/user
WORKDIR /home/user

# Create the minimal wasp project
RUN wasp new app -t minimal

# Pre-run migration to download prisma engines and cache dependencies
WORKDIR /home/user/app
RUN wasp db migrate-dev --name init || true

LABEL Author="any-task-builder"
LABEL Description="Wasp Kanban project management evaluation task environment."

CMD ["/bin/bash"]

COPY test_initial_state.py /bootstrap/test_initial_state.py

# Setup entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
