###########################  Backend build  #################################
FROM python:3.10-bullseye AS backend-builder

WORKDIR /app
RUN apt-get update && apt-get install -y \
    patchelf build-essential gcc g++ && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY ../backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install nuitka

COPY ../backend ./backend
RUN nuitka \
    --standalone \
    --follow-imports \
    --include-package=passlib.handlers \
    --output-dir=/compiled \
    backend/main.py   

###########################  Front-end build  ################################
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY ../frontend/package*.json ./
RUN npm install
COPY ../frontend .
RUN npm run build             

###########################  Final image #####################################
# ⚠  use Debian-based nginx so the compiled binary finds glibc symbols
FROM nginx:1.25-bullseye

# Nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Front-end
COPY --from=frontend-builder /app/build /usr/share/nginx/html

# Backend binary
COPY --from=backend-builder /compiled/main.dist/ /app/

# Start script
COPY all-in-one/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
