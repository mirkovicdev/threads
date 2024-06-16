"use client"
import { sidebarLinks } from '@/constants'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Bottombar = () => {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <section className="bottombar">
      <div className="bottombar_container">
      {sidebarLinks.map((link) => {
          const isActive = (pathname.includes(link.route) 
          && link.route.length > 1)
          || pathname === link.route;
        return (
          <Link
            key={link.label}
            href={link.route}
            className={`bottombar_link ${isActive && 'bg-primary-500'}`}>
              <Image 
              src={link.imgURL}
              key={link.label}
              height={24}
              width={24}
              alt="image"/>
              <p className="text-subtle-medium text-light-1 max-sm:hidden">{link.label.split(/\s+/)[0]}</p>
          </Link>
        )}
      )}
      </div>
    </section>
  )
}

export default Bottombar
