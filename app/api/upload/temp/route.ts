import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2/client'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
    try {
        // 인증 확인
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // 파일 타입 검증
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'JPG, PNG, WEBP, GIF 파일만 업로드 가능합니다' }, { status: 400 })
        }

        // 파일 크기 제한 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다' }, { status: 400 })
        }

        // 파일 확장자 추출
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png'

        // temp 폴더에 고유한 파일명으로 저장
        const fileName = `temp/${user.id}/${uuidv4()}.${ext}`

        // 파일을 버퍼로 변환
        const buffer = Buffer.from(await file.arrayBuffer())

        // R2에 업로드
        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: fileName,
                Body: buffer,
                ContentType: file.type,
            })
        )

        const url = `${R2_PUBLIC_URL}/${fileName}`

        return NextResponse.json({ url })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // 인증 확인
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { url } = await request.json()

        if (!url) {
            return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
        }

        // URL에서 파일 경로 추출
        const publicUrl = R2_PUBLIC_URL
        if (!url.startsWith(publicUrl)) {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
        }

        const key = url.replace(`${publicUrl}/`, '')

        // temp 폴더의 해당 사용자 파일인지 확인
        if (!key.startsWith(`temp/${user.id}/`)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // R2에서 삭제
        await r2Client.send(
            new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
            })
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete error:', error)
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }
}
