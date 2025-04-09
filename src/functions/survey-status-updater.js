// This function will run on a schedule to update the status of surveys
// It is deployed as a Supabase Edge Function and scheduled to run daily at 12am

import { createClient } from '@supabase/supabase-js'

// Note: In a real deployment, these would be environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const updateSurveyStatuses = async () => {
  console.log('Starting survey status update job')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const today = new Date().toISOString().split('T')[0]
  
  try {
    // Update Scheduled surveys to Active if start_date is today or in the past
    const { data: activatedSurveys, error: activationError } = await supabase
      .from('surveys')
      .update({ status: 'Active' })
      .eq('status', 'Scheduled')
      .lte('start_date', today)
      .select()
    
    if (activationError) {
      console.error('Error activating surveys:', activationError)
    } else {
      console.log(`Activated ${activatedSurveys?.length || 0} surveys`)
    }
    
    // Update Active surveys to Ended if end_date is in the past
    const { data: endedSurveys, error: endingError } = await supabase
      .from('surveys')
      .update({ status: 'Ended' })
      .eq('status', 'Active')
      .lt('end_date', today)
      .select()
    
    if (endingError) {
      console.error('Error ending surveys:', endingError)
    } else {
      console.log(`Ended ${endedSurveys?.length || 0} surveys`)
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Survey statuses updated successfully',
        activated: activatedSurveys?.length || 0,
        ended: endedSurveys?.length || 0
      })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to update survey statuses',
        details: error.message
      })
    }
  }
}

// This is the entry point for the Edge Function, it will be the handler
export default async (req, res) => {
  // You can add authorization checks here to prevent unauthorized invocations
  // For example, check for a secret token in the request headers
  
  const result = await updateSurveyStatuses()
  return new Response(
    result.body,
    { 
      status: result.statusCode,
      headers: { 'Content-Type': 'application/json' }
    }
  )
} 