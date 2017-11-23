import Delivery from '../src/index'

const project = new Delivery('6380f5f9-4bd0-4e80-91f5-9da2ccf3bd6b', 'ew0KICAiYWxnIjogIkhTMjU2IiwNCiAgInR5cCI6ICJKV1QiDQp9.ew0KICAidWlkIjogInVzcl8wdlZLT3BNazlrRFBTcThnYUZRQnlmIiwNCiAgImVtYWlsIjogImxlQHN5bWJpby5hZ2VuY3kiLA0KICAicHJvamVjdF9pZCI6ICI2MzgwZjVmOS00YmQwLTRlODAtOTFmNS05ZGEyY2NmM2JkNmIiLA0KICAianRpIjogImdFbUR6WWpON3dnTm1mTFAiLA0KICAidmVyIjogIjEuMC4wIiwNCiAgImdpdmVuX25hbWUiOiAiTEVPIEV4cHJlc3MiLA0KICAiZmFtaWx5X25hbWUiOiAiU1lNQklPIiwNCiAgImF1ZCI6ICJwcmV2aWV3LmRlbGl2ZXIua2VudGljb2Nsb3VkLmNvbSINCn0.cHMA5bijursuRVAMet_liMYFXZWQYhJfD4MZh5RlSro')

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
