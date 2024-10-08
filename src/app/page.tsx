"use client";

import React, { useState } from "react";
import {
  useForm,
  SubmitHandler,
  FormProvider,
  Controller,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import moment from "moment";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import UploadFile from "@/components/UploadFile";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IFormInputs {
  startTime: string;
  endTime: string;
}

interface Transaction {
  date: string;
  time: string;
  amount: number;
}

const schema = yup.object().shape({
  startTime: yup.string().required("Bắt buộc chọn giờ bắt đầu"),
  endTime: yup.string().required("Bắt buộc chọn giờ kết thúc"),
});

export default function Home() {
  const methods = useForm<IFormInputs>({
    resolver: yupResolver(schema),
    defaultValues: {
      startTime: "",
      endTime: "",
    },
  });

  const [data, setData] = useState<Transaction[]>([]);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [uniqueDates, setUniqueDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const handleDataExtracted = (
    extractedData: (string | number | undefined)[][]
  ) => {
    const startRowIndex = extractedData.findIndex((row) => {
      return (
        row.includes("Ngày") &&
        row.includes("Giờ") &&
        row.includes("Thành tiền (VNĐ)")
      );
    });

    if (startRowIndex === -1) {
      alert(
        "Kiểm tra lại file của bạn, có thể nó đã sai định dạng file mẫu cho phép"
      );
      return;
    }

    const headers = extractedData[startRowIndex] as string[];
    const timeIndex = headers.indexOf("Giờ");
    const amountIndex = headers.indexOf("Thành tiền (VNĐ)");

    const dateIndex = headers.indexOf("Ngày");
    // Lấy ngày đầu tiên từ cột "Ngày" sau hàng tiêu đề
    const transactions = extractedData
      .slice(startRowIndex + 1)
      .map((row) => {
        const dateStr =
          typeof row[dateIndex] === "string" ? row[dateIndex].trim() : "";
        const timeValue = row[timeIndex];
        let timeStr = "";
        let amount = 0;

        // Chuyển đổi thời gian nếu là số thập phân
        if (typeof timeValue === "number") {
          const totalMinutes = timeValue * 24 * 60;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = Math.floor(totalMinutes % 60);
          const seconds = Math.round((totalMinutes * 60) % 60);
          timeStr = moment({
            hour: hours,
            minute: minutes,
            second: seconds,
          }).format("HH:mm:ss");
        } else if (typeof timeValue === "string") {
          timeStr = timeValue.trim();
        }

        if (typeof row[amountIndex] === "number") {
          amount = row[amountIndex];
        } else if (typeof row[amountIndex] === "string") {
          amount = parseFloat(row[amountIndex].replace(/,/g, ""));
        }

        if (dateStr && timeStr && !isNaN(amount)) {
          return { date: dateStr, time: timeStr, amount };
        }
        return null;
      })
      .filter(Boolean);

    const dates = Array.from(
      new Set(transactions.map((item) => item?.date))
    ).filter((date): date is string => date !== undefined);
    setUniqueDates(dates);
    setData(transactions as Transaction[]);
  };

  const onSubmit: SubmitHandler<IFormInputs> = (values) => {
    const dateToUse = uniqueDates.length === 1 ? uniqueDates[0] : selectedDate;

    if (!dateToUse) {
      alert("Vui lòng chọn ngày!");
      return;
    }

    const start = moment(
      `${dateToUse} ${values.startTime}`,
      "DD/MM/YYYY HH:mm"
    );
    const end = moment(`${dateToUse} ${values.endTime}`, "DD/MM/YYYY HH:mm");

    if (!start.isValid() || !end.isValid()) {
      alert("Thời gian không hợp lệ!");
      return;
    }

    const filteredData = data.filter((item) => {
      const dateTimeStr = `${item.date} ${item.time}`;
      const dateTime = moment(dateTimeStr, [
        "DD/MM/YYYY hh:mm:ss A",
        "DD/MM/YYYY HH:mm:ss",
      ]);
      return dateTime.isBetween(start, end, null, "[)");
    });

    const total = filteredData.reduce((acc, curr) => acc + curr.amount, 0);
    setTotalAmount(total);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Data Report</h1>
      <UploadFile onDataExtracted={handleDataExtracted} />

      {uniqueDates.length > 0 && (
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            {uniqueDates.length === 1 ? (
              <h2 className="text-lg">
                Trong file là doanh số trong ngày: {uniqueDates[0]}
              </h2>
            ) : (
              <div className="mb-4">
                <h2 className="text-lg">
                  Trong file là doanh số trong ngày: {uniqueDates.join(", ")}
                </h2>
                <label htmlFor="date-select" className="block font-medium">
                  Chọn ngày
                </label>
                <Select onValueChange={setSelectedDate} value={selectedDate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn ngày" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Controller
              name="startTime"
              control={methods.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giờ bắt đầu</FormLabel>
                  <FormControl>
                    <input type="time" {...field} className="input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              name="endTime"
              control={methods.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giờ kết thúc</FormLabel>
                  <FormControl>
                    <input type="time" {...field} className="input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" variant="default">
              Truy vấn
            </Button>
          </form>
        </FormProvider>
      )}

      {totalAmount !== null && (
        <div className="mt-4">
          <h2 className="text-xl">
            Tổng Thành Tiền: {totalAmount.toLocaleString()} VND
          </h2>
        </div>
      )}
    </div>
  );
}
