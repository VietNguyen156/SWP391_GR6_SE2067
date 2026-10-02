import httpClient from '../../../services/httpClient.js'

export async function getPublishedCourses() {
  const response = await httpClient.get('/public/courses')
  return response.data.data
}

