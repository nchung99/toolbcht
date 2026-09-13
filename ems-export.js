(() => {
  function parseActivity(text) {
    let thoiGianHoc = "", tenBuoiHoc = "";
    let match = text.match(/^(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*[AP]M)\s*:\s*(.+)$/i);
    if (match) {
      thoiGianHoc = match[1].replace(/\s+/g, " ").trim();
      tenBuoiHoc = match[2].replace(/^[A-Z0-9]+\s*-\s*/i, "").trim();
    } else {
      match = text.match(/^(.+?)\s*\((\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*[AP]M)\)$/i);
      if (match) {
        tenBuoiHoc = match[1].replace(/^[A-Z0-9]+\s*-\s*/i, "").trim();
        thoiGianHoc = match[2].replace(/\s+/g, " ").trim();
      }
    }
    thoiGianHoc = thoiGianHoc.replace(/^11:(\d{2})\s*-\s*12:(\d{2})\s*PM$/i, "11:$1 - 12:$2 AM");
    return { thoiGianHoc, tenBuoiHoc };
  }
  const fullClassName = document.querySelector(".moduleTitle h2 a")?.innerText.trim() || "";
  const className = fullClassName.split("(")[0].trim().replace(/[\\/:*?"<>|]/g, "");
  const activityText = document.querySelector(".activity-name")?.innerText.trim() || "";
  const { thoiGianHoc, tenBuoiHoc } = parseActivity(activityText);
  const ngayHoc = document.getElementById("selected_date")?.innerText.trim() || "";
  const tenBaiHoc = document.querySelector('#syllabus_info .ss-syllabus[data-type="topic"]')?.innerText.trim() || "";
  const noiDungBaiHoc = document.querySelector('#syllabus_info .ss-syllabus[data-type="syllabus"]')?.innerText.trim() || "";
  const danhSachHocVien = [];
  document.querySelectorAll("table.list-student tbody tr").forEach(row => {
    const attendance = row.querySelector(".attendance_type")?.value || "";
    if (attendance === "P" || attendance === "L") {
      const tenHocVien = row.querySelector(".student_name")?.innerText.trim() || "";
      const nickName = row.children[3]?.innerText.trim() || "";
      const diem = row.querySelector(".homework_score")?.value.trim() || "";
      danhSachHocVien.push({ tenHocVien, nickName, diemDanh: attendance === "P" ? "Có mặt" : "Đi trễ", diem: diem === "" ? null : Number(diem) });
    }
  });
  const data = { tenLop: className, ngayHoc, thoiGianHoc, tenBuoiHoc, tenBaiHoc, noiDungBaiHoc, danhSachHocVien };
  console.log("===== Student Report JSON ====="); console.log(data);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = `${className}.json`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
})();
