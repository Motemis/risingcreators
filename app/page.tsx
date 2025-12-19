import { supabase } from '@/lib/supabase'

type Creator = {
  id: string
  display_name: string
  username: string
  platform: string
  niche: string
  followers: number
  engagement_rate: number
  score: number
}

export default async function Home() {
  const { data: creators, error } = await supabase
    .from('creators')
    .select('*')

  if (error) {
    console.error('Error fetching creators:', error)
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-4xl font-bold text-white mb-8">
        Rising Creators
      </h1>
      
      <div className="grid gap-4">
        {creators?.map((creator: Creator) => (
          <div 
            key={creator.id}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {creator.display_name}
                </h2>
                <p className="text-gray-400">
                  @{creator.username} · {creator.platform}
                </p>
                <p className="text-gray-500 mt-1">
                  {creator.niche}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {creator.followers?.toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm">followers</p>
              </div>
            </div>
            
            <div className="mt-4 flex gap-6">
              <div>
                <p className="text-green-400 font-semibold">
                  {creator.engagement_rate}%
                </p>
                <p className="text-gray-500 text-sm">engagement</p>
              </div>
              <div>
                <p className="text-blue-400 font-semibold">
                  {creator.score}/100
                </p>
                <p className="text-gray-500 text-sm">score</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}