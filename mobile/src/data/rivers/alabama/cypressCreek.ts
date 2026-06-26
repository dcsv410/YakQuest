// go to https://waterdata.usgs.gov/ to find gauge IDs and flow stats for real rivers. 

import { River } from "../types";

export const cypressCreek: River = {
  id: "cypress",
  name: "Cypress Creek",
  difficulty: 3,
  cleanliness: 4,
  fishing: 5,
  usgsGaugeId: "03590000",
  flowStats: {
    lowPercentile: 115,
    median: 180,
    highPercentile: 230,
    max: 500,
  },
  accessPoints: {
    public: [
      {
        id: "cypress-pa-1",
        name: "Cox Creek Bridge Canoe Ramp (Public Access)",
        latitude: 34.83068,
        longitude: -87.70394,
      },
      {
        id: "cypress-pa-2",
        name: "Wildwood Park Canoe Ramp (Public Access)",
        latitude: 34.80348,
        longitude: -87.69462,
      },
      {
        id: "cypress-pa-3",
        name: "Coffee Rd (Public Access)",
        latitude: 34.78610,
        longitude: -87.69661,
      },
    ],

    private: [
    ],
  },
  pois: [    
  ],
  coordinates: [
  {
    "latitude": 34.83064836819874,
    "longitude": -87.70390827540996
  },
  {
    "latitude": 34.8301990137742,
    "longitude": -87.70327515787517
  },
  {
    "latitude": 34.82951971378391,
    "longitude": -87.70254339224807
  },
  {
    "latitude": 34.82860309807177,
    "longitude": -87.7019756947472
  },
  {
    "latitude": 34.82781229118093,
    "longitude": -87.70144530424997
  },
  {
    "latitude": 34.82714034337609,
    "longitude": -87.70132012653056
  },
  {
    "latitude": 34.82657867964541,
    "longitude": -87.70162801065605
  },
  {
    "latitude": 34.82626056632161,
    "longitude": -87.70196283690551
  },
  {
    "latitude": 34.82642354251574,
    "longitude": -87.70269242227974
  },
  {
    "latitude": 34.82663708082681,
    "longitude": -87.70528363345444
  },
  {
    "latitude": 34.82663679926722,
    "longitude": -87.70593659847275
  },
  {
    "latitude": 34.82621018287281,
    "longitude": -87.70683687761182
  },
  {
    "latitude": 34.82595101528629,
    "longitude": -87.70757662907846
  },
  {
    "latitude": 34.82553232362661,
    "longitude": -87.70821466218723
  },
  {
    "latitude": 34.82530470948773,
    "longitude": -87.70868722756441
  },
  {
    "latitude": 34.82531631601579,
    "longitude": -87.70932475219006
  },
  {
    "latitude": 34.82527304609239,
    "longitude": -87.70998383493867
  },
  {
    "latitude": 34.82503827067298,
    "longitude": -87.71086759364744
  },
  {
    "latitude": 34.8248648588843,
    "longitude": -87.71150076220745
  },
  {
    "latitude": 34.82494568196036,
    "longitude": -87.71193409322011
  },
  {
    "latitude": 34.82525170693493,
    "longitude": -87.712404546581
  },
  {
    "latitude": 34.82681747234457,
    "longitude": -87.71431416218991
  },
  {
    "latitude": 34.8280087958493,
    "longitude": -87.71600293394407
  },
  {
    "latitude": 34.82827173211287,
    "longitude": -87.71653526793479
  },
  {
    "latitude": 34.8281822291456,
    "longitude": -87.71710242661553
  },
  {
    "latitude": 34.8279127002193,
    "longitude": -87.71767426815428
  },
  {
    "latitude": 34.82739473723014,
    "longitude": -87.71834564618678
  },
  {
    "latitude": 34.82646966261125,
    "longitude": -87.719179721689
  },
  {
    "latitude": 34.82609500238792,
    "longitude": -87.71933116767138
  },
  {
    "latitude": 34.82549687651368,
    "longitude": -87.71923125521867
  },
  {
    "latitude": 34.82494640177686,
    "longitude": -87.71890590039837
  },
  {
    "latitude": 34.82358916314865,
    "longitude": -87.71859471830135
  },
  {
    "latitude": 34.82236269758928,
    "longitude": -87.71873145476327
  },
  {
    "latitude": 34.82122137933236,
    "longitude": -87.71944517662541
  },
  {
    "latitude": 34.82017968576178,
    "longitude": -87.72019665291089
  },
  {
    "latitude": 34.81954264092378,
    "longitude": -87.72057618323466
  },
  {
    "latitude": 34.81874481936978,
    "longitude": -87.72122560540389
  },
  {
    "latitude": 34.81815320739861,
    "longitude": -87.72198410214766
  },
  {
    "latitude": 34.81773890449245,
    "longitude": -87.72226551872818
  },
  {
    "latitude": 34.81702109359642,
    "longitude": -87.72239248041346
  },
  {
    "latitude": 34.81648458727172,
    "longitude": -87.72206954045116
  },
  {
    "latitude": 34.81609560606469,
    "longitude": -87.72130645868975
  },
  {
    "latitude": 34.81592495500706,
    "longitude": -87.72038233168041
  },
  {
    "latitude": 34.81588913775104,
    "longitude": -87.7192814271861
  },
  {
    "latitude": 34.81638235452692,
    "longitude": -87.71814506149164
  },
  {
    "latitude": 34.81733828418008,
    "longitude": -87.71633407460614
  },
  {
    "latitude": 34.81844842825305,
    "longitude": -87.71471887381104
  },
  {
    "latitude": 34.81894652615912,
    "longitude": -87.71380022666567
  },
  {
    "latitude": 34.81928060570259,
    "longitude": -87.71289082517953
  },
  {
    "latitude": 34.81935796118736,
    "longitude": -87.71175891771209
  },
  {
    "latitude": 34.81928075159206,
    "longitude": -87.71070508578643
  },
  {
    "latitude": 34.81908839936648,
    "longitude": -87.70978056719285
  },
  {
    "latitude": 34.81863123581914,
    "longitude": -87.70901984777005
  },
  {
    "latitude": 34.81787755153882,
    "longitude": -87.7085410540758
  },
  {
    "latitude": 34.81700784884679,
    "longitude": -87.70834261344093
  },
  {
    "latitude": 34.81589296233818,
    "longitude": -87.70787535339696
  },
  {
    "latitude": 34.81479070775148,
    "longitude": -87.70732605037131
  },
  {
    "latitude": 34.81409867768486,
    "longitude": -87.70719466823216
  },
  {
    "latitude": 34.81335357604776,
    "longitude": -87.70711433520442
  },
  {
    "latitude": 34.81242752905274,
    "longitude": -87.70745532355656
  },
  {
    "latitude": 34.81152698238764,
    "longitude": -87.70797323095576
  },
  {
    "latitude": 34.81087109834486,
    "longitude": -87.70827372445692
  },
  {
    "latitude": 34.81009491086891,
    "longitude": -87.70836630281191
  },
  {
    "latitude": 34.80961632771886,
    "longitude": -87.70813640429427
  },
  {
    "latitude": 34.80934939867576,
    "longitude": -87.70753207684884
  },
  {
    "latitude": 34.80926493592878,
    "longitude": -87.70679622536173
  },
  {
    "latitude": 34.809929044201,
    "longitude": -87.70536695641158
  },
  {
    "latitude": 34.81166274360935,
    "longitude": -87.70227413321334
  },
  {
    "latitude": 34.8118190033405,
    "longitude": -87.70142634640743
  },
  {
    "latitude": 34.81179290154026,
    "longitude": -87.700672575205
  },
  {
    "latitude": 34.81153420856926,
    "longitude": -87.70001268663844
  },
  {
    "latitude": 34.81095691950893,
    "longitude": -87.69973898878003
  },
  {
    "latitude": 34.81009673734906,
    "longitude": -87.69959519732049
  },
  {
    "latitude": 34.80960471549433,
    "longitude": -87.69955869494405
  },
  {
    "latitude": 34.8091503565406,
    "longitude": -87.69979844768147
  },
  {
    "latitude": 34.80798705520234,
    "longitude": -87.7005123112458
  },
  {
    "latitude": 34.80693346549312,
    "longitude": -87.700822471705
  },
  {
    "latitude": 34.80618358502256,
    "longitude": -87.70088694972776
  },
  {
    "latitude": 34.80559176575334,
    "longitude": -87.70056600419103
  },
  {
    "latitude": 34.80499202940263,
    "longitude": -87.69988398257307
  },
  {
    "latitude": 34.80460237501686,
    "longitude": -87.69871825901262
  },
  {
    "latitude": 34.80435449395465,
    "longitude": -87.69740666887947
  },
  {
    "latitude": 34.80394220921259,
    "longitude": -87.69607767460602
  },
  {
    "latitude": 34.80356068125619,
    "longitude": -87.69477365756842
  },
  {
    "latitude": 34.80318417666476,
    "longitude": -87.69382046495325
  },
  {
    "latitude": 34.80260758975311,
    "longitude": -87.69302970446599
  },
  {
    "latitude": 34.80191169149102,
    "longitude": -87.69278288803196
  },
  {
    "latitude": 34.80152695501046,
    "longitude": -87.69301000951602
  },
  {
    "latitude": 34.80139542947882,
    "longitude": -87.69375777727767
  },
  {
    "latitude": 34.80110101877729,
    "longitude": -87.69490906881394
  },
  {
    "latitude": 34.80114222319328,
    "longitude": -87.69577482275801
  },
  {
    "latitude": 34.80155125689321,
    "longitude": -87.69667463901729
  },
  {
    "latitude": 34.80214352803469,
    "longitude": -87.69778854172567
  },
  {
    "latitude": 34.80241299850016,
    "longitude": -87.69871366509523
  },
  {
    "latitude": 34.80273840291042,
    "longitude": -87.69995058018638
  },
  {
    "latitude": 34.80394774973837,
    "longitude": -87.70228920084666
  },
  {
    "latitude": 34.80508213795764,
    "longitude": -87.70453527131947
  },
  {
    "latitude": 34.80573659445037,
    "longitude": -87.70605771945004
  },
  {
    "latitude": 34.80596072515623,
    "longitude": -87.70723955481542
  },
  {
    "latitude": 34.80604409109771,
    "longitude": -87.70848375888582
  },
  {
    "latitude": 34.80587202617997,
    "longitude": -87.70913391747138
  },
  {
    "latitude": 34.80530760911624,
    "longitude": -87.71012638983919
  },
  {
    "latitude": 34.80450514770198,
    "longitude": -87.71065915817799
  },
  {
    "latitude": 34.80366169759659,
    "longitude": -87.71065715737474
  },
  {
    "latitude": 34.80265809821275,
    "longitude": -87.71026735052695
  },
  {
    "latitude": 34.80173790900633,
    "longitude": -87.70935789061687
  },
  {
    "latitude": 34.80088394713778,
    "longitude": -87.7081671221269
  },
  {
    "latitude": 34.80022401979389,
    "longitude": -87.70684761796831
  },
  {
    "latitude": 34.79969074787218,
    "longitude": -87.70462793076629
  },
  {
    "latitude": 34.79896152238005,
    "longitude": -87.7012844627148
  },
  {
    "latitude": 34.79859624330117,
    "longitude": -87.70008191117137
  },
  {
    "latitude": 34.79793205200242,
    "longitude": -87.69859767131591
  },
  {
    "latitude": 34.79739017140128,
    "longitude": -87.6975503622275
  },
  {
    "latitude": 34.79677922634164,
    "longitude": -87.69691524946357
  },
  {
    "latitude": 34.79616262615465,
    "longitude": -87.69669091085862
  },
  {
    "latitude": 34.79452945184839,
    "longitude": -87.69659268116199
  },
  {
    "latitude": 34.79224782020281,
    "longitude": -87.69674658022466
  },
  {
    "latitude": 34.79018493243292,
    "longitude": -87.69710267410716
  },
  {
    "latitude": 34.78945417491166,
    "longitude": -87.6972289417415
  },
  {
    "latitude": 34.78811074564995,
    "longitude": -87.69706520570519
  },
  {
    "latitude": 34.7860199079508,
    "longitude": -87.69659209000525
  }
]
};