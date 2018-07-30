<template>
    <section class="container user-panel">
        <gk-logo></gk-logo>
        <el-form :model="user" @submit.native.prevent ref="form" :rules="rules">
            <el-form-item prop="account">
                <el-input :placeholder="$t('帐号')" v-model="user.account" @blur="refreshVerify" @input="refreshVerify">
                    <i slot="prefix" class="fa fa-user"></i>
                </el-input>
            </el-form-item>
            <el-form-item prop="password">
                <el-input :placeholder="$t('密码')" type="password" v-model="user.password" @keyup.enter.native="submitForm">
                    <i slot="prefix" class="fa fa-lock"></i>
                </el-input>
            </el-form-item>
            <verify-code-item ref="verify" prop="verify_code" v-model="user.verify_code" uri="/index/verify5"
                              @keyup.enter.native="submitForm"></verify-code-item>
            <el-form-item size="mini">
                <el-checkbox v-if="!$store.state.setting.hide_remember" class="remember" :border="true" v-model="user.remember">
                    {{ $t('记住密码') }}
                </el-checkbox>
                <el-button v-if="!$store.state.setting.hide_findpassword" type="text" class="findpassword" @click="findPassword">
                    {{ $t('忘记密码?') }}
                </el-button>
            </el-form-item>
            <el-button type="primary" class="submit-btn" @click="submitForm" :loading="btnLoading">{{$t('登录')}}</el-button>
        </el-form>
    </section>
</template>

<script>
  import {login} from '~/assets/api';
  import VerifyCodeItem from '~/components/VerifyCodeItem';
  import GkLogo from '~/components/GkLogo';
  import md5 from 'blueimp-md5';
  import {Base64} from 'js-base64';

  export default {
    head() {
      return {
        title: this.$t('登录')
      };
    },
    components: {
      GkLogo,
      VerifyCodeItem
    },
    data() {
      return {
        user: {
          account: '',
          password: '',
          remember: 0,
          verify_code: ''
        },
        loaded: false,
        btnLoading: false,
        rules: {
          account: [
            {required: true, message: this.$t('请输入帐号'), trigger: 'blur'}
          ],
          password: [
            {required: true, message: this.$t('请输入密码'), trigger: 'blur'}
          ],
          verify_code: [
            {
              validator: (rule, value, callback) => {
                if (value === '' && this.$refs['verify'].show) {
                  callback(new Error(rule.message));
                } else {
                  callback();
                }
              }, message:  this.$t('请输入验证码'), trigger: 'blur'
            }
          ]
        }
      }
    },
    methods: {
      submitForm() {
        this.$refs.form.validate((valid) => {
          if (valid) {
            this.btnLoading = true;
            let user = _.cloneDeep(this.user);
            user.account = this.formatAccount(user.account);
            if (user.account.indexOf('\\') > 0) {
              user.password = Base64.encode(user.password);
            } else {
              user.password = md5(user.password);
            }
            login(user).then(() => {
              try {
                if (window.top.opener && window.top.opener.loginCallback) {
                  window.top.opener.loginCallback(window.top);
                  return;
                }
              } catch (e) {
              }
              setTimeout(() => {
                window.top.location.href = '/index/dispatch';
              }, 1000);
            }, () => {
              this.refreshVerify();
              this.btnLoading = false
            });
          } else {
            return false;
          }
        });
      },

      refreshVerify() {
        if (this.user.account) {
          this.$refs['verify'].refresh({
            account: this.formatAccount(this.user.account)
          });
        } else {
          this.$refs['verify'].hide();
        }
      },

      formatAccount: function (account) {
        let prefix = this.pageSetting.login_prefix || '';
        return (prefix ? prefix + '\\' : '') + account;
      },

      findPassword() {
        location.href = '/account/findpassword'
      }
    }
  }
</script>

<style scoped lang="scss">
    .container {

        .remember {
            border: 0;
            padding: 0;
            height: 20px;
        }

        .findpassword {
            float: right;
        }
    }
</style>
