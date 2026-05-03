/**
 * useSupabaseAuthState
 * Substitui useMultiFileAuthState do Baileys.
 * Persiste creds e keys no Supabase em vez do filesystem do Railway.
 */

const { initAuthCreds, BufferJSON, proto } = require('@whiskeysockets/baileys');

function useSupabaseAuthState(supabase, sessionId) {
  // Helpers para serializar/deserializar Buffers no JSON
  function encode(obj) {
    return JSON.parse(JSON.stringify(obj, BufferJSON.replacer));
  }
  function decode(obj) {
    return JSON.parse(JSON.stringify(obj), BufferJSON.reviver);
  }

  async function loadState() {
    const { data } = await supabase
      .from('wpp_sessions')
      .select('creds, keys')
      .eq('session_id', sessionId)
      .single();
    return data;
  }

  async function saveState(creds, keys) {
    await supabase
      .from('wpp_sessions')
      .upsert({
        session_id: sessionId,
        creds: encode(creds),
        keys: encode(keys),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id' });
  }

  async function deleteState() {
    await supabase
      .from('wpp_sessions')
      .delete()
      .eq('session_id', sessionId);
  }

  async function getAuthState() {
    const stored = await loadState();

    let creds = stored?.creds ? decode(stored.creds) : initAuthCreds();
    let keys  = stored?.keys  ? decode(stored.keys)  : {};

    const state = {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          for (const id of ids) {
            let val = keys[`${type}-${id}`];
            if (val && type === 'app-state-sync-key') {
              val = proto.Message.AppStateSyncKeyData.fromObject(val);
            }
            data[id] = val;
          }
          return data;
        },
        set: async (data) => {
          for (const [type, typeData] of Object.entries(data)) {
            for (const [id, val] of Object.entries(typeData || {})) {
              if (val) {
                keys[`${type}-${id}`] = val;
              } else {
                delete keys[`${type}-${id}`];
              }
            }
          }
          // Salva keys imediatamente ao setar
          await saveState(creds, keys);
        },
      },
    };

    async function saveCreds() {
      await saveState(creds, keys);
    }

    return { state, saveCreds, deleteState };
  }

  return getAuthState();
}

module.exports = { useSupabaseAuthState };
