export const packagesConf =[
    {
      type: 'list',
      name: 'packages',
      message: '选择要打包部署测试的项目？',
      choices: [
        {
          name: '训练系统',
          value: 0,
        },
        {
          name: '项目',
          value: 1,
        },
      ],
    },
  ]


export const pathConf = [
    {
        localpath: '****',
        remotepath: '****',
        buildDir: 'dist'
    }
]

export const getBuildConf = (message) => [
  {
    type: 'list',
    name: 'build',
    message: (message ? '打包文件已存在' : '打包文件不存在') + '，是否重新进行打包？',
    choices: [
      {
        name: '否',
        value: 0,
      }, {
        name: '是',
        value: 1,
      },
    ],
  },
]

export const serviceConf = {
  host: '192.168.1.1',
  username: '***',
  password: '******',
  dir: '/data/space/'
}
