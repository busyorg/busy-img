const getAvatarURL = (id) => {
  const idLastDigit = id.toString().slice(-1);
  switch (idLastDigit) {
    case '0': return 'https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948446/hv6vfwoxxrhbo5hqrr67.png';
    case '1': return 'https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948446/odivdmixxlgcjzu5kwo5.png';
    case '2': return 'https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948446/apwiydegsm9xkl8dwlg6.png';
    case '3': return 'https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948446/a5z6ptacnxwtmlmiutru.png';
    case '4': return 'https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948779/waualh2u8cin8rtntp3x.png';
    case '5': return 'https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948446/ybg6j4rmwnfsp0lzpfew.png';
    case '6': return 'https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948446/dprtnd1unvjknhjmppix.png';
    case '7': return 'https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948447/tcpwoh6ej18rtd4bjsqa.png';
    case '8': return 'https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948447/p72avlprkfariyti7q2l.png';
    case '9': return 'https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948447/kmhouzmhi7nc2o2xcrsr.png';
    default: return 'https://res.cloudinary.com/hpiynhbhq/image/upload/v1506948447/p72avlprkfariyti7q2l.png';
  }
};

module.exports = {
  getAvatarURL,
};
