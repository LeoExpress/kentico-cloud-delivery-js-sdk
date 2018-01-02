import Delivery from '../src/index'

const project = new Delivery('0f7b3aa6-4808-47eb-a951-cafcd086dc39', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiJ1c3JfMHZUU3E1MmxxWU81bTRVSlA1SkpqcCIsImVtYWlsIjoibWFydGluLmNhanRoYW1sQHN5bWJpby5hZ2VuY3kiLCJwcm9qZWN0X2lkIjoiMGY3YjNhYTYtNDgwOC00N2ViLWE5NTEtY2FmY2QwODZkYzM5IiwianRpIjoiVHFlMTVpSkF5LXlJd1pSZSIsInZlciI6IjEuMC4wIiwiZ2l2ZW5fbmFtZSI6Ik1hcnRpbiIsImZhbWlseV9uYW1lIjoiQ2FqdGhhbWwiLCJhdWQiOiJwcmV2aWV3LmRlbGl2ZXIua2VudGljb2Nsb3VkLmNvbSJ9.UrXMWSFKsOTugtdQlIsQfWVcGARFshtx4C5c6LscIJM')

describe('basics', () => {
  it('get content types', async () => {
    const types = await project.getContentTypes(true)

    expect(types.length).toBeGreaterThan(1)
  })

  it('get content items', async () => {
    const query = 'system.type=cafe&depth=0'
    const data = await project.getContentItems(query, true)

    expect(data.length).toBeGreaterThan(0)
  })
})
