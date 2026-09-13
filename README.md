# KAPLA Student Report v2

Tool riêng để tạo phiếu đánh giá học tập cho **1 buổi học** từ JSON lấy trên EMS.

## Có sẵn
- Upload JSON hoặc dán JSON.
- Tự điền thông tin lớp/buổi/bài/nội dung/học viên.
- Chỉnh tên, nickname, điểm.
- Chọn Robotics/Coding và giáo viên.
- Gemini backend tạo 4 năng lực, điểm nổi bật, điểm cần cải thiện, nhận xét, lời động viên.
- Sửa tay sau khi AI tạo.
- Preview từng học viên.
- Xuất PDF từng bé và ZIP toàn lớp.

## Deploy Vercel
1. Đưa nguyên folder lên GitHub.
2. Import repo vào Vercel, Framework Preset = Other.
3. Thêm Environment Variable `GEMINI_API_KEY`.
4. Deploy.

Không đưa Gemini key vào frontend/GitHub.


## Giao diện v2
- Làm lại bố cục gần mẫu tham khảo: form điều khiển bên trái, preview phiếu A4 bên phải.
- Giữ nguyên flow JSON → chỉnh dữ liệu → Gemini → PDF/ZIP.


## v16
- AI tạo 5–6 Điểm nổi bật và 3–5 Điểm cần cải thiện cho từng học viên.
- Nội dung được yêu cầu cá nhân hóa theo điểm/skills và nội dung buổi học, tránh lặp cùng một bộ câu cho cả lớp.
- Khi chưa chạy AI, giao diện mặc định hiển thị 6 ý nổi bật và 4 ý cần cải thiện.
