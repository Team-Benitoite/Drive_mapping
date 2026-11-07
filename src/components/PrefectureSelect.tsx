import { prefectures } from '../utils/prefectures';

export interface PrefectureSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function PrefectureSelect({
  value,
  onChange,
  required = false,
}: PrefectureSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
    >
      <option value="">都道府県</option>
      {prefectures.map((prefecture) => (
        <option key={prefecture.code} value={prefecture.code}>
          {prefecture.name}
        </option>
      ))}
    </select>
  );
}
