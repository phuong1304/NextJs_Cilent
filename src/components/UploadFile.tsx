import React, { FC } from "react";
import * as XLSX from "xlsx";
import { Button } from "./ui/button";

interface UploadFileProps {
  onDataExtracted: (data: (string | number)[][]) => void;
}

const UploadFile: FC<UploadFileProps> = ({ onDataExtracted }) => {
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Kiểm tra định dạng file
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (fileExtension !== "xlsx") {
        alert("Vui lòng chỉ chọn file Excel có định dạng .xlsx");
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: "",
            });

            onDataExtracted(jsonData as (string | number)[][]);
          } catch (error) {
            console.error("Lỗi khi đọc file:", error);
            alert(
              "Không thể đọc nội dung file. Đảm bảo file là định dạng Excel .xlsx hợp lệ."
            );
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Lỗi khi tải file:", error);
        alert("Đã xảy ra lỗi khi tải file. Vui lòng thử lại.");
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        style={{ display: "block" }}
        id="file-upload"
      />
      <label htmlFor="file-upload">
        <Button variant="ghost">Upload File Excel</Button>
      </label>
    </div>
  );
};

export default UploadFile;
