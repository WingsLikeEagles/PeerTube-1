async function register ({ registerHook, registerSetting, settingsManager, storageManager, peertubeHelpers }) {
  const actionHooks = [
    'action:application.listening',

    'action:api.video.updated',
    'action:api.video.deleted',
    'action:api.video.uploaded',
    'action:api.video.viewed',

    'action:api.video-thread.created',
    'action:api.video-comment-reply.created',
    'action:api.video-comment.deleted'
  ]

  for (const h of actionHooks) {
    registerHook({
      target: h,
      handler: () => peertubeHelpers.logger.debug('Run hook %s.', h)
    })
  }

  registerHook({
    target: 'filter:api.videos.list.params',
    handler: obj => addToCount(obj)
  })

  registerHook({
    target: 'filter:api.videos.list.result',
    handler: obj => addToTotal(obj)
  })

  registerHook({
    target: 'filter:api.video.get.result',
    handler: video => {
      video.name += ' <3'

      return video
    }
  })

  registerHook({
    target: 'filter:api.video.upload.accept.result',
    handler: ({ accepted }, { videoBody }) => {
      if (!accepted) return { accepted: false }
      if (videoBody.name.indexOf('bad word') !== -1) return { accepted: false, errorMessage: 'bad word '}

      return { accepted: true }
    }
  })

  registerHook({
    target: 'filter:api.video-thread.create.accept.result',
    handler: ({ accepted }, { commentBody }) => checkCommentBadWord(accepted, commentBody)
  })

  registerHook({
    target: 'filter:api.video-comment-reply.create.accept.result',
    handler: ({ accepted }, { commentBody }) => checkCommentBadWord(accepted, commentBody)
  })

  registerHook({
    target: 'filter:api.video-threads.list.params',
    handler: obj => addToCount(obj)
  })

  registerHook({
    target: 'filter:api.video-threads.list.result',
    handler: obj => addToTotal(obj)
  })

  registerHook({
    target: 'filter:api.video-thread-comments.list.result',
    handler: obj => {
      obj.data.forEach(c => c.text += ' <3')

      return obj
    }
  })

  registerHook({
    target: 'filter:video.auto-blacklist.result',
    handler: (blacklisted, { video }) => {
      if (blacklisted) return true
      if (video.name.includes('please blacklist me')) return true

      return false
    }
  })

  registerHook({
    target: 'filter:api.user.signup.allowed.result',
    handler: (result, params) => {
      if (params && params.body.email.includes('jma')) {
        return { allowed: false, errorMessage: 'No jma' }
      }

      return result
    }
  })
}

async function unregister () {
  return
}

module.exports = {
  register,
  unregister
}

// ############################################################################

function addToCount (obj) {
  return Object.assign({}, obj, { count: obj.count + 1 })
}

function addToTotal (result) {
  return {
    data: result.data,
    total: result.total + 1
  }
}

function checkCommentBadWord (accepted, commentBody) {
  if (!accepted) return { accepted: false }
  if (commentBody.text.indexOf('bad word') !== -1) return { accepted: false, errorMessage: 'bad word '}

  return { accepted: true }
}
