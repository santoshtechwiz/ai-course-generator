// app/api/unsplash/route.js
import axios from 'axios';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import https from 'https';
export async function GET(req,res) {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');
    const instance = axios.create({
        httpsAgent: new https.Agent({  
          rejectUnauthorized: false
        })
      });
    try {
        const response = instance.get(`https://api.unsplash.com/photos/random`, {
            params: {
                query: topic,
                client_id: process.env.UNSPLASH_API_KEY
            }
        });
     return  NextResponse.json({data:(await response).data});
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }
}
