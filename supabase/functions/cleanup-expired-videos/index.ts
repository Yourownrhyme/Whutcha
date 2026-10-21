import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Optional override for cutoff hours (default 12)
    let hours = 12
    try {
      const body = await req.json()
      if (body && body.hours) hours = parseInt(body.hours, 10) || 12
    } catch (_) {
      // No body or GET request, default to 12 hours
    }

    // Call atomic SQL cleanup function
    const { data: expiredRecords, error: rpcErr } = await supabaseClient.rpc('cleanup_expired_videos', {
      p_hours: hours
    })

    if (rpcErr) throw rpcErr

    const filesToRemove: string[] = []
    if (expiredRecords && Array.isArray(expiredRecords)) {
      for (const row of expiredRecords) {
        if (row.video_hash && !row.video_hash.startsWith('http') && !row.video_hash.startsWith('./assets/')) {
          filesToRemove.push(row.video_hash)
        }
      }
    }

    let storageRemovedCount = 0
    if (filesToRemove.length > 0) {
      // Chunk removals into batches of 50 to avoid payload limits
      for (let i = 0; i < filesToRemove.length; i += 50) {
        const batch = filesToRemove.slice(i, i + 50)
        const { error: storageErr } = await supabaseClient.storage.from('videos').remove(batch)
        if (storageErr) {
          console.error("Storage batch removal error:", storageErr)
        } else {
          storageRemovedCount += batch.length
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      cutoff_hours: hours,
      purged_db_records: expiredRecords?.length || 0,
      purged_storage_blobs: storageRemovedCount,
      files: filesToRemove
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
