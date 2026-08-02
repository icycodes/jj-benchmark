FROM pochi-browser-verification-base

# Install Wasp CLI
RUN npm i -g @wasp.sh/wasp-cli@latest

# Set up working directory and seed the minimal Wasp application
WORKDIR /home/user
RUN wasp new app -t minimal

# Ensure all permissions are correct for /home/user
RUN chmod -R 0777 /home/user

LABEL Author="any-task-builder"
LABEL Description="Wasp dynamic form builder development environment with Node.js and Wasp CLI."

CMD ["/bin/bash"]

COPY test_initial_state.py /bootstrap/test_initial_state.py

# Setup entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
