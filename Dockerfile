FROM mcr.microsoft.com/playwright:v1.63.0-jammy
WORKDIR /app
RUN npm init -y >/dev/null && npm i playwright-core@1.63.0 >/dev/null
COPY probe.mjs .
CMD ["sh", "-c", "node probe.mjs headless; xvfb-run -a node probe.mjs headed; echo PROBE_DONE"]
