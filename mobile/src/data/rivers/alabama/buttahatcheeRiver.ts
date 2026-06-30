// go to https://waterdata.usgs.gov/ to find gauge IDs and flow stats for real rivers. 

import { River } from "../../types";

export const buttahatcheeRiver: River = {
  id: "buttahatchee",
  name: "Buttahatchee River",
  slug: "Buttahatchee River",  
  state: "AL",
  stateName: "Alabama",
  difficulty: 3,
  cleanliness: 4,
  fishing: 5,
  usgsGaugeId: "02438000",
  flowStats: {
    lowPercentile: 100,
    median: 175,
    highPercentile: 300,
    max: 500,
  },
  accessPoints: {
    public: [
        {
        id: "buttahatchee-pa-1",
        name: "Munsingwear Canoe & Kayak Launch Area (Public Access)",
        type: "public",
        latitude: 34.13099,
        longitude: -87.98129,
      },
      {
        id: "buttahatchee-pa-2",
        name: "Tree House Canoe & Kayak Launch (Public Access)",
        type: "public",
        latitude: 34.09659,
        longitude: -87.99848,
      },
      {
        id: "buttahatchee-pa-3",
        name: "Henson Springs Rd (Public Access)",
        type: "public",
        latitude: 34.01887,
        longitude: -88.05340,
      },
    ],

    private: [
    ],
  },
  pois: [
  ],
  coordinates: [
  {
    "latitude": 34.13105169800744,
    "longitude": -87.98122928796708
  },
  {
    "latitude": 34.1299742636857,
    "longitude": -87.98242582225106
  },
  {
    "latitude": 34.12868576801156,
    "longitude": -87.98332260712846
  },
  {
    "latitude": 34.12669459962551,
    "longitude": -87.98422834858299
  },
  {
    "latitude": 34.12272521796279,
    "longitude": -87.98538879290844
  },
  {
    "latitude": 34.12028257305425,
    "longitude": -87.98620203667852
  },
  {
    "latitude": 34.11939665085112,
    "longitude": -87.98646960922653
  },
  {
    "latitude": 34.11785467923784,
    "longitude": -87.98629983703145
  },
  {
    "latitude": 34.1162388101226,
    "longitude": -87.98637035348096
  },
  {
    "latitude": 34.11431714081642,
    "longitude": -87.98674122353268
  },
  {
    "latitude": 34.11198617910038,
    "longitude": -87.98702036962487
  },
  {
    "latitude": 34.10981143222148,
    "longitude": -87.98724111619863
  },
  {
    "latitude": 34.10885684932073,
    "longitude": -87.98715283717489
  },
  {
    "latitude": 34.1075778948054,
    "longitude": -87.98625522871487
  },
  {
    "latitude": 34.10663780030477,
    "longitude": -87.98485172633175
  },
  {
    "latitude": 34.10494584441789,
    "longitude": -87.982481945299
  },
  {
    "latitude": 34.10224167133096,
    "longitude": -87.97841442635901
  },
  {
    "latitude": 34.1012787033346,
    "longitude": -87.9778340575606
  },
  {
    "latitude": 34.09997424194175,
    "longitude": -87.97740752478526
  },
  {
    "latitude": 34.09907627808717,
    "longitude": -87.97762257164936
  },
  {
    "latitude": 34.09877782626529,
    "longitude": -87.9783651301997
  },
  {
    "latitude": 34.09870004924411,
    "longitude": -87.97929546183914
  },
  {
    "latitude": 34.0992984120505,
    "longitude": -87.98043603508694
  },
  {
    "latitude": 34.1014267815649,
    "longitude": -87.98324769741457
  },
  {
    "latitude": 34.10183472520027,
    "longitude": -87.98430167724919
  },
  {
    "latitude": 34.10230981053822,
    "longitude": -87.98608889046238
  },
  {
    "latitude": 34.10305844834834,
    "longitude": -87.98686100192141
  },
  {
    "latitude": 34.10481542868734,
    "longitude": -87.98786820147718
  },
  {
    "latitude": 34.10609922234562,
    "longitude": -87.98886995496392
  },
  {
    "latitude": 34.10689719185611,
    "longitude": -87.99030121620851
  },
  {
    "latitude": 34.10702372282567,
    "longitude": -87.99098744284136
  },
  {
    "latitude": 34.10677712065633,
    "longitude": -87.99202735119896
  },
  {
    "latitude": 34.10633580730617,
    "longitude": -87.99325709628916
  },
  {
    "latitude": 34.10612422637465,
    "longitude": -87.99506314519824
  },
  {
    "latitude": 34.10612383592783,
    "longitude": -87.99674843027181
  },
  {
    "latitude": 34.10601206058327,
    "longitude": -87.99795364111054
  },
  {
    "latitude": 34.10553529691418,
    "longitude": -87.99886495298249
  },
  {
    "latitude": 34.10481606288931,
    "longitude": -87.99973371738491
  },
  {
    "latitude": 34.10383453938191,
    "longitude": -88.00048218320774
  },
  {
    "latitude": 34.1029832274811,
    "longitude": -88.00098846548615
  },
  {
    "latitude": 34.10233661394003,
    "longitude": -88.0010946533709
  },
  {
    "latitude": 34.10160466509715,
    "longitude": -88.00088570446405
  },
  {
    "latitude": 34.10038849776485,
    "longitude": -88.00030449760541
  },
  {
    "latitude": 34.09960572034749,
    "longitude": -87.99975233083678
  },
  {
    "latitude": 34.09790883715503,
    "longitude": -87.99814940397658
  },
  {
    "latitude": 34.09736390159853,
    "longitude": -87.99814659163087
  },
  {
    "latitude": 34.09669460364458,
    "longitude": -87.99846354115472
  },
  {
    "latitude": 34.09636985937257,
    "longitude": -87.99904301879789
  },
  {
    "latitude": 34.09634539582073,
    "longitude": -87.99973633566717
  },
  {
    "latitude": 34.09679974190735,
    "longitude": -88.0008433427503
  },
  {
    "latitude": 34.09729722627719,
    "longitude": -88.00197298215475
  },
  {
    "latitude": 34.097640822724,
    "longitude": -88.00288783211604
  },
  {
    "latitude": 34.09799704065567,
    "longitude": -88.0035333516904
  },
  {
    "latitude": 34.09835739490583,
    "longitude": -88.0037405530086
  },
  {
    "latitude": 34.09951127308281,
    "longitude": -88.00394509139997
  },
  {
    "latitude": 34.10053593483824,
    "longitude": -88.00391628295331
  },
  {
    "latitude": 34.10155783903441,
    "longitude": -88.0039631354509
  },
  {
    "latitude": 34.10210588400429,
    "longitude": -88.00438766180366
  },
  {
    "latitude": 34.10256577059361,
    "longitude": -88.0051101708788
  },
  {
    "latitude": 34.10270807262645,
    "longitude": -88.00625709031809
  },
  {
    "latitude": 34.10257228300659,
    "longitude": -88.00729829062512
  },
  {
    "latitude": 34.1022117551248,
    "longitude": -88.00781296297028
  },
  {
    "latitude": 34.10119255152287,
    "longitude": -88.00862603451478
  },
  {
    "latitude": 34.09964114850707,
    "longitude": -88.00968577121353
  },
  {
    "latitude": 34.09713420903356,
    "longitude": -88.01068521693024
  },
  {
    "latitude": 34.09599225948522,
    "longitude": -88.01117668360348
  },
  {
    "latitude": 34.09489710342715,
    "longitude": -88.01223375128417
  },
  {
    "latitude": 34.09380258566338,
    "longitude": -88.012779704616
  },
  {
    "latitude": 34.09284790017047,
    "longitude": -88.01291922097751
  },
  {
    "latitude": 34.09140128960092,
    "longitude": -88.0128325737203
  },
  {
    "latitude": 34.09061503682102,
    "longitude": -88.01312777397904
  },
  {
    "latitude": 34.09000622067836,
    "longitude": -88.01351633641461
  },
  {
    "latitude": 34.08722775502935,
    "longitude": -88.01585813480074
  },
  {
    "latitude": 34.08674122749172,
    "longitude": -88.01617364751641
  },
  {
    "latitude": 34.08612731623762,
    "longitude": -88.0162361378741
  },
  {
    "latitude": 34.08507791834093,
    "longitude": -88.01615794241111
  },
  {
    "latitude": 34.08283201170939,
    "longitude": -88.0161745872266
  },
  {
    "latitude": 34.08199454569953,
    "longitude": -88.01605329654969
  },
  {
    "latitude": 34.08113341813623,
    "longitude": -88.01619504715974
  },
  {
    "latitude": 34.08018670817744,
    "longitude": -88.01667588550386
  },
  {
    "latitude": 34.07898902636358,
    "longitude": -88.01732018194326
  },
  {
    "latitude": 34.07818038650284,
    "longitude": -88.01736095554006
  },
  {
    "latitude": 34.07717142957819,
    "longitude": -88.01733638545994
  },
  {
    "latitude": 34.07557019881254,
    "longitude": -88.0172720307501
  },
  {
    "latitude": 34.07440820035796,
    "longitude": -88.01709978534969
  },
  {
    "latitude": 34.07378373864198,
    "longitude": -88.01736190353459
  },
  {
    "latitude": 34.07306273145849,
    "longitude": -88.01771933634988
  },
  {
    "latitude": 34.07195657185588,
    "longitude": -88.01800206769735
  },
  {
    "latitude": 34.07143191680527,
    "longitude": -88.01804155034563
  },
  {
    "latitude": 34.07089550212818,
    "longitude": -88.01783013964273
  },
  {
    "latitude": 34.06991191918254,
    "longitude": -88.01704907585152
  },
  {
    "latitude": 34.06966461170628,
    "longitude": -88.01647755416847
  },
  {
    "latitude": 34.06949710175694,
    "longitude": -88.01580655118276
  },
  {
    "latitude": 34.06986668836245,
    "longitude": -88.01487052700935
  },
  {
    "latitude": 34.07094506829373,
    "longitude": -88.01218460754892
  },
  {
    "latitude": 34.07098025307743,
    "longitude": -88.01136408194714
  },
  {
    "latitude": 34.07069222628294,
    "longitude": -88.01074771395601
  },
  {
    "latitude": 34.06990106415225,
    "longitude": -88.01007490308004
  },
  {
    "latitude": 34.06831154159334,
    "longitude": -88.00845587231159
  },
  {
    "latitude": 34.06714810563854,
    "longitude": -88.00812150114663
  },
  {
    "latitude": 34.06621206796569,
    "longitude": -88.00855152118665
  },
  {
    "latitude": 34.06577696042579,
    "longitude": -88.0085923478864
  },
  {
    "latitude": 34.06544247951157,
    "longitude": -88.00810182494078
  },
  {
    "latitude": 34.06526483556075,
    "longitude": -88.00730017537013
  },
  {
    "latitude": 34.06543100251648,
    "longitude": -88.00656361161033
  },
  {
    "latitude": 34.06520561981645,
    "longitude": -88.00590049291475
  },
  {
    "latitude": 34.06467677314347,
    "longitude": -88.00530254554667
  },
  {
    "latitude": 34.06402947411075,
    "longitude": -88.0048850383625
  },
  {
    "latitude": 34.06327568593048,
    "longitude": -88.00448501423419
  },
  {
    "latitude": 34.06264346814928,
    "longitude": -88.00383899477023
  },
  {
    "latitude": 34.0622473294662,
    "longitude": -88.00391778809507
  },
  {
    "latitude": 34.06181216727553,
    "longitude": -88.00426199879725
  },
  {
    "latitude": 34.06112924553258,
    "longitude": -88.00498840271536
  },
  {
    "latitude": 34.06050953731224,
    "longitude": -88.00587810419674
  },
  {
    "latitude": 34.06036961848515,
    "longitude": -88.00672914983424
  },
  {
    "latitude": 34.06038909205437,
    "longitude": -88.00761302658826
  },
  {
    "latitude": 34.06063745045236,
    "longitude": -88.00866574352423
  },
  {
    "latitude": 34.06082093843938,
    "longitude": -88.00960333124635
  },
  {
    "latitude": 34.06058288099145,
    "longitude": -88.00997698767603
  },
  {
    "latitude": 34.05997763488067,
    "longitude": -88.01026317477957
  },
  {
    "latitude": 34.05860667875872,
    "longitude": -88.0100129228203
  },
  {
    "latitude": 34.05690413790513,
    "longitude": -88.00971783109216
  },
  {
    "latitude": 34.05566742219819,
    "longitude": -88.00913337697703
  },
  {
    "latitude": 34.05467045690546,
    "longitude": -88.00806091014765
  },
  {
    "latitude": 34.05427308432036,
    "longitude": -88.00809028000887
  },
  {
    "latitude": 34.05402969673226,
    "longitude": -88.00853017208559
  },
  {
    "latitude": 34.05412366703157,
    "longitude": -88.00916286699834
  },
  {
    "latitude": 34.0536966728292,
    "longitude": -88.01032686179673
  },
  {
    "latitude": 34.05265533143098,
    "longitude": -88.01173291620972
  },
  {
    "latitude": 34.05022044768552,
    "longitude": -88.01690939433429
  },
  {
    "latitude": 34.0499471556186,
    "longitude": -88.01723513845972
  },
  {
    "latitude": 34.04804351702708,
    "longitude": -88.0183849166649
  },
  {
    "latitude": 34.04756146058834,
    "longitude": -88.01912182437812
  },
  {
    "latitude": 34.04631769886608,
    "longitude": -88.02173135895114
  },
  {
    "latitude": 34.04408490828475,
    "longitude": -88.02559400080412
  },
  {
    "latitude": 34.04377883873813,
    "longitude": -88.02640553498911
  },
  {
    "latitude": 34.04334509032377,
    "longitude": -88.02848883921611
  },
  {
    "latitude": 34.04225767582933,
    "longitude": -88.03253804149143
  },
  {
    "latitude": 34.04161791083025,
    "longitude": -88.03534942446188
  },
  {
    "latitude": 34.04116780401959,
    "longitude": -88.0364744098791
  },
  {
    "latitude": 34.04070148883751,
    "longitude": -88.03756827241725
  },
  {
    "latitude": 34.03994578135793,
    "longitude": -88.0386540318897
  },
  {
    "latitude": 34.0389686488175,
    "longitude": -88.03985700185777
  },
  {
    "latitude": 34.03839740006871,
    "longitude": -88.04058103258319
  },
  {
    "latitude": 34.03775749386935,
    "longitude": -88.04168701171676
  },
  {
    "latitude": 34.03726921423878,
    "longitude": -88.04272219083249
  },
  {
    "latitude": 34.03681427465654,
    "longitude": -88.04396535435464
  },
  {
    "latitude": 34.03605354331416,
    "longitude": -88.04762730254927
  },
  {
    "latitude": 34.03581332347633,
    "longitude": -88.04978281668635
  },
  {
    "latitude": 34.03558165339132,
    "longitude": -88.05122929169033
  },
  {
    "latitude": 34.03518770559766,
    "longitude": -88.05239158179882
  },
  {
    "latitude": 34.03437520385437,
    "longitude": -88.05286234232227
  },
  {
    "latitude": 34.03350288444469,
    "longitude": -88.05289704114716
  },
  {
    "latitude": 34.03305436803753,
    "longitude": -88.05222279697188
  },
  {
    "latitude": 34.03288170526969,
    "longitude": -88.05128875189278
  },
  {
    "latitude": 34.03266805793205,
    "longitude": -88.0506419120232
  },
  {
    "latitude": 34.03214521162535,
    "longitude": -88.0504024245923
  },
  {
    "latitude": 34.03165391335153,
    "longitude": -88.0508174590274
  },
  {
    "latitude": 34.03116040215355,
    "longitude": -88.05143102373974
  },
  {
    "latitude": 34.03060390518557,
    "longitude": -88.05241330069465
  },
  {
    "latitude": 34.03026302761675,
    "longitude": -88.05330844801014
  },
  {
    "latitude": 34.02973822906871,
    "longitude": -88.05373308764712
  },
  {
    "latitude": 34.02830592549449,
    "longitude": -88.05432962005199
  },
  {
    "latitude": 34.0269755486314,
    "longitude": -88.05544634810032
  },
  {
    "latitude": 34.02655764319024,
    "longitude": -88.05567770639037
  },
  {
    "latitude": 34.02591636876334,
    "longitude": -88.05601621053184
  },
  {
    "latitude": 34.02531571066849,
    "longitude": -88.05614838585501
  },
  {
    "latitude": 34.02495289540725,
    "longitude": -88.05575698567036
  },
  {
    "latitude": 34.02495289496116,
    "longitude": -88.05572888920915
  },
  {
    "latitude": 34.02481528430226,
    "longitude": -88.05517322051108
  },
  {
    "latitude": 34.0249888829075,
    "longitude": -88.05456577696518
  },
  {
    "latitude": 34.02561119626843,
    "longitude": -88.05425333344601
  },
  {
    "latitude": 34.02618055646045,
    "longitude": -88.05388346230743
  },
  {
    "latitude": 34.02633405217832,
    "longitude": -88.053213445569
  },
  {
    "latitude": 34.02598633642546,
    "longitude": -88.05243021285182
  },
  {
    "latitude": 34.02525687981236,
    "longitude": -88.051399224115
  },
  {
    "latitude": 34.02456000752764,
    "longitude": -88.0513156969126
  },
  {
    "latitude": 34.02391893872594,
    "longitude": -88.05184853934236
  },
  {
    "latitude": 34.02340971824928,
    "longitude": -88.05259066949243
  },
  {
    "latitude": 34.02276578459423,
    "longitude": -88.05285100790935
  },
  {
    "latitude": 34.02197743077759,
    "longitude": -88.05255910582352
  },
  {
    "latitude": 34.02148619421026,
    "longitude": -88.05290023295618
  },
  {
    "latitude": 34.02058309195168,
    "longitude": -88.05349019256035
  },
  {
    "latitude": 34.0195478772947,
    "longitude": -88.05326773735368
  },
  {
    "latitude": 34.01888008439254,
    "longitude": -88.05343393967564
  }
]
};