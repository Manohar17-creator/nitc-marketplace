import { NextResponse } from 'next/server'

// Temporary fake data - no MongoDB needed
const sampleListings = [
  {
    _id: '1',
    title: 'Data Structures & Algorithms Textbook',
    description: 'Cormen book in excellent condition. Used for one semester only.',
    price: 450,
    category: 'books',
    sellerName: 'Rahul Kumar',
    sellerPhone: '+91 98765 43210',
    sellerEmail: 'rahul.b220xxx@nitc.ac.in',
    location: 'Mega Hostel',
    status: 'active',
    createdAt: new Date('2024-10-17T10:00:00')
  },
  {
    _id: '2',
    title: 'iPhone 12 - 128GB',
    description: 'Mint condition, with box and all accessories. Battery health 89%.',
    price: 32000,
    category: 'electronics',
    sellerName: 'Priya Sharma',
    sellerPhone: '+91 87654 32109',
    sellerEmail: 'priya.b220xxx@nitc.ac.in',
    location: 'Ladies Hostel',
    status: 'active',
    createdAt: new Date('2024-10-17T08:00:00')
  },
  {
    _id: '3',
    title: 'Train Ticket: Calicut to Bangalore',
    description: 'Tomorrow 6:30 AM, AC 3-Tier confirmed. Urgent sale!',
    price: 800,
    category: 'tickets',
    sellerName: 'Arjun Menon',
    sellerPhone: '+91 76543 21098',
    sellerEmail: 'arjun.b220xxx@nitc.ac.in',
    location: 'Quilon Hostel',
    status: 'active',
    createdAt: new Date('2024-10-17T11:00:00')
  },
  {
    _id: '4',
    title: 'MacBook Air M1 - 8GB/256GB',
    description: '1 year old, under warranty. Perfect for coding.',
    price: 65000,
    category: 'electronics',
    sellerName: 'Sneha Reddy',
    sellerPhone: '+91 54321 09876',
    sellerEmail: 'sneha.b220xxx@nitc.ac.in',
    location: 'PG Near Campus',
    status: 'active',
    createdAt: new Date('2024-10-17T09:00:00')
  }
]

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let filtered = [...sampleListings]

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(l => l.category === category)
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(l => 
        l.title.toLowerCase().includes(searchLower) ||
        l.description.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({ listings: filtered })
  } catch (error) {
    console.error('Get listings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    console.log('New listing posted:', data)
    
    return NextResponse.json({
      message: 'Listing created successfully (fake data)',
      listingId: Date.now().toString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}