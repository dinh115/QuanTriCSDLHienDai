# Dùng Node.js base image nhẹ
FROM node:18-alpine

# Đặt thư mục làm việc trong container
WORKDIR /app

# Copy toàn bộ mã nguồn vào container
COPY . .

# Cài đặt dependencies
RUN npm install

# Mở port 5000
EXPOSE 5000

# Chạy ứng dụng Node.js trực tiếp
CMD ["node", "server.js"]