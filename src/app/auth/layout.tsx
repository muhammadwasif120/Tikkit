export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080A10] relative overflow-hidden">
      {children}
    </div>
  )
}