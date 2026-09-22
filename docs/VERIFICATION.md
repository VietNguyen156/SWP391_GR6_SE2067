# Trạng thái kiểm tra

- Đã kiểm tra cấu trúc project sau khi thêm auth.
- Java runtime trong môi trường đóng gói: JDK 21.
- Node runtime trong môi trường đóng gói: Node 22.
- Frontend `npm install` không hoàn tất trong giới hạn thời gian của môi trường, nên chưa chạy được `npm run build` tại đây.
- Maven không được cài trong môi trường đóng gói, nên chưa chạy `mvn test/package` tại đây.
- Không có `node_modules`, `target`, `.env`, mật khẩu MySQL hay secret production trong ZIP.
- Hãy chạy theo README trên máy Windows của bạn để kiểm tra end-to-end với MySQL local.
