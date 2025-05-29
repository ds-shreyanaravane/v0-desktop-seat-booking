import Image from 'next/image';

  <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#005792] to-[#003366] p-4">
    <div className="w-full max-w-md space-y-8">
      {/* Logo/Icon */}
      <div className="flex flex-col items-center">
        <Image
          src="/marico-icon.png"
          alt="Marico Logo"
          width={150}
          height={150}
          className="mb-6"
          priority
        />
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-white">
          Employee Login
        </h2>
      </div>
      
      <div className="mt-8 bg-white p-8 shadow-2xl rounded-lg"> 