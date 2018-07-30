<template>
    <section class="container user-panel">
        <gk-logo ></gk-logo>
        <el-form :model="form" ref="form" v-if="showForm" @submit.native.prevent :rules="rules">
            <el-form-item prop="email">
                <el-input type="email" :placeholder="$t('邮箱')" v-model="form.email" @keyup.enter.native="submitForm">
                    <i slot="prefix" class="fa fa-envelope"></i>
                </el-input>
            </el-form-item>
            <el-button type="primary" class="submit-btn" @click="submitForm" :loading="btnLoading">{{$t('发送重置密码邮件')}}</el-button>
        </el-form>
        <div v-else class="success">
            <h2><i class="fa fa-check-circle"></i>{{$t('重设密码邮件已发送')}}</h2>
            <p>{{$t('一封邮件已经发送到邮箱。请前往您的邮箱查看邮件。若没有收到邮件，请检查您的垃圾邮件，或者')}}
                <el-button :loading="btnLoading" type="text" @click="submitForm">{{$t('重新发送')}}</el-button>
            </p>
        </div>
    </section>
</template>

<script>
  import {findpassword} from '~/assets/api'
  import GkLogo from '~/components/GkLogo';

  export default {
    components: {GkLogo},
    head() {
      return {
        title: this.$t('找回密码')
      }
    },
    data() {
      return {
        form: {
          email: ''
        },
        showForm: true,
        btnLoading: false,
        rules: {
          email: [
            {required: true, message: this.$t('请输入邮箱地址'), trigger: 'blur'},
            {type: 'email', message: this.$t('邮箱格式错误'), trigger: 'blur'}
          ]
        }
      }
    },
    methods: {
      submitForm() {
        this.$refs.form.validate((valid) => {
          if (valid) {
            this.btnLoading = true;
            let para = {
              email: this.email
            };
            findpassword(para).then(() => {
              this.$message({
                message: this.$t('发送成功'),
                type: 'success'
              });
              this.showForm = false;
              this.btnLoading = false;
            }, () => {
              this.btnLoading = false;
            });
          } else {
            return false;
          }
        });
      }
    }
  }
</script>

<style scoped lang="scss">
    .success {
        h2 {
            font-size: 22px;
            color: #808080;
            font-weight: 400;
        }
        p {
            font-size: 18px;
            color: #b2b2b2;
            line-height: 26px;
            button {
                padding: 0;
                font-size: 18px;
            }
        }
        .fa {
            color: #3dd777;
            font-size: 30px;
            margin-right: 4px;
            vertical-align: middle;
            margin-top: -4px;
        }
    }
</style>
