import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Copy, Check, MessageSquare, Facebook, Instagram, Twitter, Linkedin, Mail } from 'lucide-react';
import { platFormApi } from '../api/platform.api';


import { QRCodeCanvas } from 'qrcode.react';

const WhatsAppQRCode = ({ link }: { link: string }) => {
  return (
    <div className="p-4 bg-white rounded-xl inline-block">
      <QRCodeCanvas
        value={link}           // your WhatsApp link here
        size={150}             // QR code size in px
        bgColor="#ffffff"      // background color
        fgColor="#000000"      // QR code color
        level="H"              // error correction level
        includeMargin={true}   // margin around QR
      />
      <p className="text-sm text-gray-500">Scan to Chat on WhatsApp</p>
    </div>
  );
};



export const Share = ({ currentPage }: any) => {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [isWAConnected, setisWAConnected] = useState<boolean>(false);

  const isConnected = async () => {
    try {
      const { responseObject } = await platFormApi.isConnected('whatsapp')
      setisWAConnected(responseObject.isFound)
    } catch (error) {

    }

  }

  useEffect(() => {
    isConnected()
  }, [currentPage]);

  const [platforms, setPlatforms] = useState<any[]>([
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-100',
      link: 'https://wa.me/1234567890',
      description: 'Share your WhatsApp Business link',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-100',
      link: 'https://facebook.com/share',
      description: 'Share on Facebook',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-pink-100',
      link: 'https://instagram.com',
      description: 'Share on Instagram',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'from-sky-500 to-sky-600',
      bgColor: 'bg-sky-100',
      link: 'https://twitter.com/share',
      description: 'Share on X (Twitter)',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'from-blue-700 to-blue-800',
      bgColor: 'bg-blue-100',
      link: 'https://linkedin.com/share',
      description: 'Share on LinkedIn',
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'from-gray-600 to-gray-700',
      bgColor: 'bg-gray-100',
      link: `mailto:?subject=Connect with me on WhatsApp&body=Chat with me:`,
      description: 'Share via Email',
    },
  ])


  const checkPlatFormConnected = async (platform: string) => {
    try {
      const { responseObject } = await platFormApi.isConnected(platform.toLowerCase());
      if (responseObject?.isFound) {
        const phoneNumber = responseObject.data.phoneNumber; // e.g. "+919876543210"
        const cleanedNumber = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;

        // create a new array with updated WhatsApp link
        const updatedPlatforms = platforms.map(p =>
          p.name === 'WhatsApp'
            ? { ...p, link: `https://wa.me/${cleanedNumber}` }
            : p
        );

        setPlatforms(updatedPlatforms);
      }
    } catch (error) {
      console.error(error);
    }
  };


  useEffect(() => {
    checkPlatFormConnected("whatsapp")
  }, [currentPage]);



  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Share Your Business</h1>
          <p className="text-xl text-gray-600">
            Connect with customers across multiple platforms
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform, index) => {
            const Icon = platform.icon;
            const Link = platform.link;
            let isCopied = copiedPlatform === platform.name;
            const isWhatsApp = platform.name === 'WhatsApp';
            if (!isWAConnected && platform.name === 'WhatsApp') {
              isCopied = false
            }
            return (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={!isWhatsApp ? {} : { y: -8 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-r ${platform.color} rounded-2xl flex items-center justify-center`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => isWhatsApp && isWAConnected ? setShowQR(showQR === platform.name ? null : platform.name) : null}
                    className={`p-2 ${platform.bgColor} rounded-xl transition-colors`}
                  >
                    <QrCode className="w-5 h-5" />
                  </motion.button>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{platform.name}</h3>
                <p className="text-sm text-gray-600 mb-6">{platform.description}</p>

                {showQR === platform.name && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="w-full aspect-square bg-white rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        {
                          isWhatsApp ?
                            <WhatsAppQRCode link={Link} />
                            :
                            <QrCode className="w-24 h-24 mx-auto text-gray-300 mb-2" />

                        }
                        {/* <p className="text-sm text-gray-500">QR Code Preview</p> */}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <input
                      type="text"
                      value={platform.link}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isWhatsApp ? false : true}
                    onClick={() => isWhatsApp ? copyToClipboard(platform.link, platform.name) : {}}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${isCopied
                      ? 'bg-emerald-500 text-white'
                      : `bg-gradient-to-r ${platform.color} text-white shadow-lg`
                      }`}
                  >
                    {
                      isWhatsApp && isWAConnected ?
                        isCopied ? (
                          <>
                            <Check className="w-5 h-5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            Copy Link
                          </>
                        ) :
                        <>
                          Not Connected
                        </>
                    }

                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/*   <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Your WhatsApp Business Link</h3>
              <p className="text-emerald-100">Share this link to start conversations with customers instantly</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => copyToClipboard('', 'main')}
              className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              {copiedPlatform === 'main' ? 'Copied!' : 'Copy Link'}
            </motion.button>
          </div>
        </motion.div> */}
      </div>
    </div>
  );
};
