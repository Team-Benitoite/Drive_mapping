import { prefectures } from '../utils/prefectures.js';

export default function PrefectureSelect({ value, onChange, required = false }) {
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
