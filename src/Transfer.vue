<template>
  <NcDialog can-close
    class="upload-by-link-dialog"
    :close-on-click-outside="false"
    :name="t('transfer', 'Upload by link')"
    size="normal"
    @closing="onCancel">

    <!-- Main form -->
    <form ref="form"
      class="upload-by-link-dialog__form"
      aria-describedby="upload-by-link-dialog-description"
      :aria-label="t('transfer', 'Link')"
      aria-live="polite"
      @submit.prevent.stop="">
      <FileRequestIntro v-show="currentStep === STEP.FIRST"
        :context="context"
        :destination.sync="destination"
        :disabled="loading"
        :label.sync="label"
        :note.sync="note" />
      <div>
        <!-- Request label -->
        <fieldset class="upload-by-link-dialog__label">
          <legend>
            {{ t('transfer', 'Link') }}
          </legend>
          <NcTextField :value="label"
            :disabled="disabled"
            :label="t('transfer', 'Link')"
            :placeholder="https://example.com/file.txt"
            :required="true"
            name="label"
            @update:value="$emit('update:label', $event)" />
        </fieldset>

        <!-- Request destination -->
        <fieldset class="upload-by-link-dialog__destination">
          <legend>
            {{ t('transfer', 'File name') }}
          </legend>
          <NcTextField :value="destination"
            :disabled="disabled"
            :label="t('transfer', 'File name')"
            :minlength="2/* cannot share root */"
            :placeholder="t('transfer', 'Select a destination')"
            :readonly="false /* cannot validate a readonly input */"
            :show-trailing-button="destination !== context.path"
            :trailing-button-icon="'undo'"
            :trailing-button-label="t('transfer', 'Revert to default')"
            name="destination"
            @click="onPickDestination"
            @keypress.prevent.stop="/* prevent typing in the input, we use the picker */"
            @paste.prevent.stop="/* prevent pasting in the input, we use the picker */"
            @trailing-button-click="$emit('update:destination', '')">
            <IconFolder :size="18" />
          </NcTextField>

          <p class="upload-by-link-dialog__info">
            <IconLock :size="18" class="upload-by-link-dialog__info-icon" />
            {{ t('transfer', 'The uploaded files are visible only to you unless you choose to share them.') }}
          </p>
        </fieldset>

        <!-- Request note -->
        <fieldset class="upload-by-link-dialog__note">
          <legend>
            {{ t('transfer', 'Add a note') }}
          </legend>
          <NcTextArea :value="note"
            :disabled="disabled"
            :label="t('transfer', 'Note for recipient')"
            :placeholder="t('transfer', 'Add a note to help people understand what you are requesting.')"
            :required="false"
            name="note"
            @update:value="$emit('update:note', $event)" />

          <p class="upload-by-link-dialog__info">
            <IconInfo :size="18" class="upload-by-link-dialog__info-icon" />
            {{ t('transfer', 'You can add links, date or any other information that will help the recipient understand what you are requesting.') }}
          </p>
        </fieldset>
      </div>
    </form>

    <!-- Controls -->
    <template #actions>
      <!-- Back -->
      <NcButton v-show="currentStep === STEP.SECOND"
        :aria-label="t('transfer', 'Previous step')"
        :disabled="loading"
        type="tertiary"
        @click="currentStep = STEP.FIRST">
        {{ t('transfer', 'Previous step') }}
      </NcButton>

      <!-- Align right -->
      <span class="dialog__actions-separator" />

      <!-- Cancel the creation -->
      <NcButton v-if="currentStep !== STEP.LAST"
        :aria-label="t('transfer', 'Cancel')"
        :disabled="loading"
        :title="t('transfer', 'Cancel the file request creation')"
        type="tertiary"
        @click="onCancel">
        {{ t('transfer', 'Cancel') }}
      </NcButton>

    <h2>{{ t('transfer', 'Upload by link') }}</h2>

    <div class="modal-content">
      <NcTextField
        :value.sync="url"
        :label="t('transfer', 'Link')"
        :label-visible="true"
        placeholder="https://example.com/file.txt">
      </NcTextField>

      <div class="row">
        <NcTextField
          :value.sync="chosenName"
          :label="t('transfer', 'File name')"
          :label-visible="true"
          :placeholder="defaults.name">
        </NcTextField>
        .
        <NcTextField
          class="short"
          :value.sync="chosenExtension"
          :label="t('transfer', 'Extension')"
          :label-visible="true"
          :placeholder="defaults.extension">
        </NcTextField>
      </div>

      <NcNoteCard type="info">
        <p>{{ t('transfer', 'Some websites provide a checksum in addition to the file. This is used after the transfer to verify that the file is not corrupted.') }}</p>
      </NcNoteCard>

      <div class="row">
        <NcSelect
          class="short"
          v-model="hashAlgo"
          inputId="hashAlgo"
          :options="['md5', 'sha1', 'sha256', 'sha512']">
        </NcSelect>

        <NcTextField
          :value.sync="hash"
          :label="t('transfer', 'Checksum')">
        </NcTextField>
      </div>

    </div>
  </NcModal>
</template>

<script>
//      <div class="buttons">
//        <NcButton
//          type="primary"
//          nativeType="submit"
//          @click="submit"
//          :disabled="!isValid">
//          <template #icon>
//<svg xmlns="http://www.w3.org/2000/svg" id="mdi-cloud-upload" viewBox="0 0 24 24"><path d="M11 20H6.5Q4.22 20 2.61 18.43 1 16.85 1 14.58 1 12.63 2.17 11.1 3.35 9.57 5.25 9.15 5.88 6.85 7.75 5.43 9.63 4 12 4 14.93 4 16.96 6.04 19 8.07 19 11 20.73 11.2 21.86 12.5 23 13.78 23 15.5 23 17.38 21.69 18.69 20.38 20 18.5 20H13V12.85L14.6 14.4L16 13L12 9L8 13L9.4 14.4L11 12.85Z" /></svg>
//          </template>
//          {{ t('transfer', 'Upload') }}
//        </NcButton>
//      </div>

  import { NcButton, NcIconSvgWrapper, NcModal, NcNoteCard, NcSelect, NcTextField } from '@nextcloud/vue'
  //import UploadIcon from './UploadIcon.vue'
  //import TransferSvg from '@mdi/svg/svg/cloud-upload.svg'
  //import pathParse from 'path-parse'
  import { joinPaths } from '@nextcloud/paths'
  import { enqueueTransfer } from './ajax.js'

  export default {
    components: { NcButton, NcIconSvgWrapper, NcModal, NcNoteCard, NcSelect, NcTextField },

    data() {
      return {
        url: '',
        chosenName: '',
        chosenExtension: '',
        hashAlgo: null,
        hash: '',
        currentDirectory: null,
        visible: false
      }
    },

    computed: {
      defaults() {
        try {
          const url = new URL(this.url)
          // const path = pathParse(url.pathname)

          return {
            name: "test",
            extension: ".png"
          }
        } catch (TypeError) {
          // The current URL is not valid
          return { name: '', extension: '' }
        }
      },

      name() {
        return this.chosenName || this.defaults.name
      },

      extension() {
        return this.chosenExtension || this.defaults.extension
      },

      isValid() {
        try {
          const url = new URL(this.url)
        } catch (TypeError) {
          // The current URL is not valid
          return false
        }

        return this.name && this.extension
      }
    },

    methods: {
      open(context) {
        this.url = ''
        this.chosenName = ''
        this.chosenExtension = ''
        this.hashAlgo = null
        this.hash = ''
        this.currentDirectory = context.path
        this.visible = true
      },

      close() {
        this.visible = false
      },

      submit() {
        const fullName = `${this.name}.${this.extension}`
        const path = joinPaths(this.currentDirectory, fullName)
        enqueueTransfer(path, this.url, this.hashAlgo || '', this.hash)
        this.close()
      }
    }
  }
</script>

<style scoped>
h2, .modal-content {
  margin: calc(var(--default-grid-baseline) * 4);
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: calc(var(--default-grid-baseline) * 4);
}

.row {
  display: flex;
  align-items: baseline;
  gap: calc(var(--default-grid-baseline) * 4);
}

.short {
  width: 12em !important;
}

.notecard {
  margin: 0 !important;
}

.buttons {
  display: flex;
  justify-content: end;
}
</style>
