import KenticoSDK from '../src/index'

const sdk = new KenticoSDK(
  '0f7b3aa6-4808-47eb-a951-cafcd086dc39',
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiJ1c3JfMHZUU3E1MmxxWU81bTRVSlA1SkpqcCIsImVtYWlsIjoibWFydGluLmNhanRoYW1sQHN5bWJpby5hZ2VuY3kiLCJwcm9qZWN0X2lkIjoiMGY3YjNhYTYtNDgwOC00N2ViLWE5NTEtY2FmY2QwODZkYzM5IiwianRpIjoiVHFlMTVpSkF5LXlJd1pSZSIsInZlciI6IjEuMC4wIiwiZ2l2ZW5fbmFtZSI6Ik1hcnRpbiIsImZhbWlseV9uYW1lIjoiQ2FqdGhhbWwiLCJhdWQiOiJwcmV2aWV3LmRlbGl2ZXIua2VudGljb2Nsb3VkLmNvbSJ9.UrXMWSFKsOTugtdQlIsQfWVcGARFshtx4C5c6LscIJM',
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiJ1c3JfMHZUU3E1MmxxWU81bTRVSlA1SkpqcCIsImp0aSI6ImVkNDBkYTJmNzQzMDRjZDc4NDA0MDY2NzU0N2M1Yzg3IiwiaWF0IjoiMTUxNTI3MDkzNiIsImV4cCI6IjE1MTc4NjI5MzYiLCJwcm9qZWN0X2lkIjoiMGY3YjNhYTY0ODA4NDdlYmE5NTFjYWZjZDA4NmRjMzkiLCJ2ZXIiOiIyLjAuMCIsInBlcm1pc3Npb25zIjpbInZpZXctY29udGVudCIsImNvbW1lbnQiLCJ1cGRhdGUtd29ya2Zsb3ciLCJ1cGRhdGUtY29udGVudCIsInB1Ymxpc2giLCJjb25maWd1cmUtc2l0ZW1hcCIsImNvbmZpZ3VyZS10YXhvbm9teSIsImNvbmZpZ3VyZS1jb250ZW50X3R5cGVzIiwiY29uZmlndXJlLXdpZGdldHMiLCJjb25maWd1cmUtd29ya2Zsb3ciLCJtYW5hZ2UtcHJvamVjdHMiLCJtYW5hZ2UtdXNlcnMiLCJjb25maWd1cmUtcHJldmlldy11cmwiLCJjb25maWd1cmUtY29kZW5hbWVzIiwiYWNjZXNzLWFwaS1rZXlzIiwibWFuYWdlLWFzc2V0cyIsIm1hbmFnZS1sYW5ndWFnZXMiLCJtYW5hZ2Utd2ViaG9va3MiLCJtYW5hZ2UtdHJhY2tpbmciXSwiYXVkIjoibWFuYWdlLmtlbnRpY29jbG91ZC5jb20ifQ.Rc2pS3BmSUbdmKA-nureLy2FMFfLMDH0lI_SEakK-Ak',
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiJ1c3JfMHZUU3E1MmxxWU81bTRVSlA1SkpqcCIsImVtYWlsIjoibWFydGluLmNhanRoYW1sQHN5bWJpby5hZ2VuY3kiLCJnaXZlbl9uYW1lIjoiTWFydGluIiwiZmFtaWx5X25hbWUiOiJDYWp0aGFtbCIsInZlciI6IjEuMC4wIiwianRpIjoiaHljZkxRRmlHeGczMEcwYSIsImF1ZCI6ImFwaS1kcmFmdC5rZW50aWNvY2xvdWQuY29tIn0.RyL9c7nhLZamEgNGn__--H4KYczuuuKIcjlVg0nZ-h0'
)

describe('basics', () => {
  it('get content types', async () => {
    const types = await sdk.getContentTypes(true)

    expect(types.length).toBeGreaterThan(1)
  })

  it('get content items', async () => {
    const query = 'system.type=cafe&depth=0'
    const data = await sdk.getContentItems(query, true)

    expect(data.length).toBeGreaterThan(0)
  })

  it('delete all content items of a type', async () => {
    const result = await sdk.deleteAllTypeItems('test')
    expect(result).toBeTruthy()
  })
/*
  it('upsert and delete content item', async (done) => {
    const item = await sdk.upsertContentItem('test', 'test-1', 'Test')
    const codename = item.codename
    expect(codename).toBe('test')
    try {
      await sdk.upsertLanguageVariant('test-1', 'cs', {name: 'Test name 2'})
      await sdk.deleteContentItem('test-1')
      done()
    } catch (e) {
      console.error(e.message)
      done.fail()
    }
  })
*/
  it('get taxonomies', async () => {
    const result = await sdk.getTaxonomies()
    console.log(result)
    expect(result).toBeTruthy()
  })
})
