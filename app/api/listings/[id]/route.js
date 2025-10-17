import { NextResponse } from 'next/server'

const sampleListing = {
  _id: '1',
  title: 'Data Structures & Algorithms Textbook',
  description: 'Cormen book in excellent condition. Used for one semester only. No marks or highlights inside.',
  price: 450,
  category: 'books',
  images: [],
  sellerName: 'Rahul Kumar',
  sellerPhone: '+91 98765 43210',
  sellerEmail: 'rahul.b220xxx@nitc.ac.in',
  location: 'Mega Hostel',
  status: 'active',
  createdAt: new Date('2024-10-17T10:00:00')
}

export async function GET(request, context) {
  try {
    const { id } = await context.params  // ← Added 'await' here
    
    return NextResponse.json({ listing: sampleListing })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 404 }
    )
  }
}

export async function DELETE(request, context) {
  try {
    const { id } = await context.params  // ← Added 'await' here
    
    return NextResponse.json({ message: 'Listing deleted' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}

export async function PUT(request, context) {
  try {
    const { id } = await context.params  // ← Added 'await' here
    
    return NextResponse.json({ message: 'Listing updated' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    )
  }
}