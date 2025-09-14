export default function Spinner({ size = 32 }) {
  return (
    <div
      className="animate-spin rounded-full border-t-4 border-blue-500 border-b-4 border-gray-200"
      style={{ width: size, height: size }}
    ></div>
  );
}
