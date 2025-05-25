
import { UserContext } from "./types.ts";

export const gatherUserContext = async (userId: string): Promise<UserContext> => {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2")
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Get user's recent tasks for context
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    // Analyze user patterns
    const categories = recentTasks?.map(t => t.category).filter(Boolean) || []
    const priorities = recentTasks?.map(t => t.priority) || []
    const durations = recentTasks?.map(t => t.estimated_duration).filter(Boolean) || []

    const categoryFreq = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const priorityFreq = priorities.reduce((acc, pri) => {
      acc[pri] = (acc[pri] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      recentTasks: recentTasks || [],
      commonCategories: Object.keys(categoryFreq).sort((a, b) => categoryFreq[b] - categoryFreq[a]).slice(0, 5),
      mostUsedPriority: Object.keys(priorityFreq).sort((a, b) => priorityFreq[b] - priorityFreq[a])[0] || 'Medium',
      averageDuration: durations.length > 0 ? '2h' : '1h',
      totalTasks: recentTasks?.length || 0
    }
  } catch (error) {
    console.error('Error gathering user context:', error)
    return { recentTasks: [], commonCategories: [], mostUsedPriority: 'Medium', averageDuration: '1h', totalTasks: 0 }
  }
}
