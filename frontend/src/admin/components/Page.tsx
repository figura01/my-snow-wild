const Page = ({ children }: { children: React.ReactNode }) => {
  return <div className="bg-gray-50 p-4 w-full h-fit rounded-md">
    { children }
  </div>
}

export default Page;