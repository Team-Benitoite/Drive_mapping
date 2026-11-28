import { prefectures } from '../utils/prefectures';

export interface PrefectureSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  ariaLabel?: string;
}

export default function PrefectureSelect({
  id,
  value,
  onChange,
  required = false,
  ariaLabel,
}: PrefectureSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      aria-label={ariaLabel}
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
